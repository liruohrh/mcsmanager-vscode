import * as vscode from "vscode";
import { MCSFileTreeDataProvider } from "@/view/file/provider";
import { MCsFileTreeViewDragDropController } from "@/view/file/DragDropController";
import { Entry, MCSFileSystemProvider } from "@/filesystem/mcs";
import { MCSInstanceTreeDataProvider } from "@/view/instance/provider";
import { McsService } from "@/service/mcs";
import { GlobalVar } from "@/utils/global";
import {
    COMMAND_DELETE_FILES,
    COMMAND_OPEN_FILE,
    COMMAND_REFRESH_FILES,
    COMMAND_REFRESH_FILE_ROOT,
    deleteFilesCommand,
    openFileCommand,
    refreshFilesCommand,
    refreshFileRootCommand,
    COMMAND_CREATE_FILE,
    createFileCommand,
    COMMAND_CREATE_DIR,
    COMMAND_DOWNLOAD_FILE,
    downloadFileCommand,
    COMMAND_UPLOAD_FILE,
    uploadFileCommand,
    COMMAND_RENAME_FILE,
    renameFileCommand,
    COMMAND_UPLOAD_EDITOR_DOCUMENTS,
    uploadEditorDocumentsCommand,
    COMMAND_OPEN_AS_WS,
    openAsWSCommand,
    copyFilesCommand,
    cutFilesCommand,
    pasteFilesCommand,
} from "@/commands/files";
import {
    COMMAND_REFRESH_INSTANCES,
    COMMAND_SELECT_INSTANCE,
    refreshInstancesCommand,
    selectInstanceCommand,
} from "@/commands/instance";
import {
    COMMAND_LOGIN,
    COMMAND_LOGOUT,
    COMMAND_OPEN_CONFIG,
    loginCommand,
    logoutCommand,
    openConfigCommand,
} from "@/commands/auth";

export function activate(context: vscode.ExtensionContext) {
    GlobalVar.context = context;
    GlobalVar.mcsService = new McsService();

    // 注册输出面板
    const outputChannel = vscode.window.createOutputChannel("MCSManager", {
        log: true,
    });
    context.subscriptions.push(outputChannel);
    GlobalVar.outputChannel = outputChannel;

    // context.globalState
    //     .keys()
    //     .forEach(
    //         async (key) => await context.globalState.update(key, undefined)
    //     );
    GlobalVar.mcsService.autoLogin().finally(async () => {
        await afterLogin();
    });
}

async function afterLogin() {
    const context = GlobalVar.context;
    // 注册MCS文件系统提供者
    const fileSystemProvider = new MCSFileSystemProvider();
    GlobalVar.fileSystemProvider = fileSystemProvider;
    context.subscriptions.push(
        vscode.workspace.registerFileSystemProvider("mcs", fileSystemProvider, {
            isCaseSensitive: true,
            isReadonly: false,
        })
    );

    // 注册视图

    // 实例视图
    const instanceTreeDataProvider = new MCSInstanceTreeDataProvider();
    GlobalVar.instanceTreeDataProvider = instanceTreeDataProvider;
    vscode.window.registerTreeDataProvider(
        "mcsInstanceExplorer",
        instanceTreeDataProvider
    );

    // 文件视图
    const fileTreeDataProvider = new MCSFileTreeDataProvider();
    GlobalVar.fileTreeDataProvider = fileTreeDataProvider;
    const mcsFileExplorer = vscode.window.createTreeView<Entry>(
        "mcsFileExplorer",
        {
            treeDataProvider: fileTreeDataProvider,
            canSelectMany: true,
            showCollapseAll: true,
            dragAndDropController: new MCsFileTreeViewDragDropController(),
        }
    );
    mcsFileExplorer.onDidChangeVisibility((e) => {
        //第一次显示时也执行 === 提前加载数据
        if (e.visible) {
            fileSystemProvider.refresh("/", false);
        }

        //防止误操作
        const clearContexts = [
            "mcsManager.hasSelectedFile",
            "mcsManager.hasSelectedSingleFile",
            "mcsManager.hasSelectedMultiFile",
            "mcsManager.hasCopyOrCutFile",
        ];
        clearContexts.forEach((context) => {
            vscode.commands.executeCommand("setContext", context, false);
        });
        fileTreeDataProvider.copyEntries = [];
        fileTreeDataProvider.cutEntries = [];
    });
    mcsFileExplorer.onDidChangeSelection((e) => {
        vscode.commands.executeCommand(
            "setContext",
            "mcsManager.hasSelectedFile",
            e.selection.length !== 0
        );
        vscode.commands.executeCommand(
            "setContext",
            "mcsManager.hasSelectedSingleFile",
            e.selection.length === 1
        );
        vscode.commands.executeCommand(
            "setContext",
            "mcsManager.hasSelectedMultiFile",
            e.selection.length > 1
        );
    });
    GlobalVar.mcsFileExplorer = mcsFileExplorer;
    context.subscriptions.push(mcsFileExplorer);

    // 注册命令

    context.subscriptions.push(
        vscode.commands.registerCommand(COMMAND_OPEN_CONFIG, openConfigCommand)
    );

    // 登录相关
    context.subscriptions.push(
        vscode.commands.registerCommand(COMMAND_LOGIN, loginCommand)
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(COMMAND_LOGOUT, logoutCommand)
    );

    // 实例
    context.subscriptions.push(
        vscode.commands.registerCommand(
            COMMAND_SELECT_INSTANCE,
            selectInstanceCommand
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            COMMAND_REFRESH_INSTANCES,
            refreshInstancesCommand
        )
    );

    // 文件
    context.subscriptions.push(
        vscode.commands.registerCommand(
            "mcsManager.copyFiles",
            copyFilesCommand
        )
    );
    context.subscriptions.push(
        vscode.commands.registerCommand("mcsManager.cutFiles", cutFilesCommand)
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(
            "mcsManager.pasteFiles",
            pasteFilesCommand
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(COMMAND_OPEN_AS_WS, openAsWSCommand)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(COMMAND_RENAME_FILE, renameFileCommand)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            COMMAND_UPLOAD_EDITOR_DOCUMENTS,
            uploadEditorDocumentsCommand
        )
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(COMMAND_UPLOAD_FILE, uploadFileCommand)
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(
            COMMAND_DOWNLOAD_FILE,
            downloadFileCommand
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(COMMAND_CREATE_DIR, (element) => {
            createFileCommand({
                isDir: true,
                element,
            });
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(COMMAND_CREATE_FILE, (element) => {
            createFileCommand({
                element,
            });
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(COMMAND_DELETE_FILES, () =>
            deleteFilesCommand()
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(COMMAND_REFRESH_FILE_ROOT, () =>
            refreshFileRootCommand()
        )
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(
            COMMAND_REFRESH_FILES,
            refreshFilesCommand
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(COMMAND_OPEN_FILE, openFileCommand)
    );

    GlobalVar.outputChannel.info("MCSManager is activated");
}

export function deactivate() {
    GlobalVar.mcsService.clearLoginState();
}
