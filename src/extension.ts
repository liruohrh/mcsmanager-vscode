import * as vscode from "vscode";
import { MCSFileTreeDataProvider } from "@/view/file/provider";
import { MCsFileTreeViewDragDropController } from "@/view/file/DragDropController";
import { Entry, MCSFileSystemProvider } from "@/filesystem/mcs";
import { MCSInstanceTreeDataProvider } from "@/view/instance/provider";
import { McsService } from "@/service/mcs";
import { GlobalVar } from "@/utils/global";
import {
    deleteFilesCommand,
    openFileCommand,
    refreshFileCommand,
    refreshRootFileCommand,
    createFileCommand,
    downloadFileCommand,
    uploadFileCommand,
    renameFileCommand,
    uploadEditorDocumentsCommand,
    openAsWSCommand,
    copyFilesCommand,
    cutFilesCommand,
    pasteFilesCommand,
    deleteFileCommand,
    copyPathCommand,
} from "@/commands/files";
import {
    copyInstancesCommand,
    refreshInstancesCommand,
    selectInstanceCommand,
} from "@/commands/instance";
import {
    loginCommand,
    logoutCommand,
    openConfigCommand,
} from "@/commands/auth";
import {
    onlyOneItemCommandWrapper,
    rightClickCommandWrapper,
    selectMultiCommandWrapper,
} from "./utils/command";
import { logger } from "./utils/log";
import {
    CONTEXT_HAS_COPY_OR_CUT_FILE,
    CONTEXT_HAS_SELECTED_FILE,
    CONTEXT_HAS_SELECTED_MULTI_FILE,
    CONTEXT_HAS_SELECTED_SINGLE_FILE,
} from "./utils/constant";

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
        if (e.visible && GlobalVar.currentInstance) {
            fileSystemProvider.refresh("/", false);
        }

        //防止误操作
        const clearContexts = [
            CONTEXT_HAS_SELECTED_FILE,
            CONTEXT_HAS_SELECTED_SINGLE_FILE,
            CONTEXT_HAS_SELECTED_MULTI_FILE,
            CONTEXT_HAS_COPY_OR_CUT_FILE,
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
            CONTEXT_HAS_SELECTED_FILE,
            e.selection.length !== 0
        );
        vscode.commands.executeCommand(
            "setContext",
            CONTEXT_HAS_SELECTED_SINGLE_FILE,
            e.selection.length === 1
        );
        vscode.commands.executeCommand(
            "setContext",
            CONTEXT_HAS_SELECTED_MULTI_FILE,
            e.selection.length > 1
        );
    });
    GlobalVar.mcsFileExplorer = mcsFileExplorer;
    context.subscriptions.push(mcsFileExplorer);

    // 注册命令

    context.subscriptions.push(
        vscode.commands.registerCommand(
            "mcsManager.openConfig",
            openConfigCommand
        )
    );

    // 登录相关
    context.subscriptions.push(
        vscode.commands.registerCommand("mcsManager.login", loginCommand)
    );
    context.subscriptions.push(
        vscode.commands.registerCommand("mcsManager.logout", logoutCommand)
    );

    // 实例
    context.subscriptions.push(
        vscode.commands.registerCommand(
            "mcsManager.selectInstance",
            selectInstanceCommand
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            "mcsManager.refreshInstances",
            refreshInstancesCommand
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            "mcsManager.copyInstance",
            rightClickCommandWrapper(copyInstancesCommand)
        )
    );

    // 文件
    //visutal workspace
    context.subscriptions.push(
        vscode.commands.registerCommand("mcsManager.openAsWS", openAsWSCommand)
    );

    //editor
    context.subscriptions.push(
        vscode.commands.registerCommand(
            "mcsManager.uploadEditorDocuments",
            uploadEditorDocumentsCommand
        )
    );

    //view title
    context.subscriptions.push(
        vscode.commands.registerCommand(
            "mcsManager.deleteFiles",
            selectMultiCommandWrapper(deleteFilesCommand)
        )
    );

    //keyshortcut
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
        vscode.commands.registerCommand(
            "mcsManager.renameFile",
            onlyOneItemCommandWrapper(renameFileCommand, true)
        )
    );

    //right menu
    context.subscriptions.push(
        vscode.commands.registerCommand(
            "mcsManager.uploadFile",
            rightClickCommandWrapper(uploadFileCommand)
        )
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(
            "mcsManager.downloadFile",
            rightClickCommandWrapper(downloadFileCommand)
        )
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(
            "mcsManager.copyPath",
            rightClickCommandWrapper(copyPathCommand)
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            "mcsManager.createDir",
            rightClickCommandWrapper((element) =>
                createFileCommand({
                    isDir: true,
                    element,
                })
            )
        )
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(
            "mcsManager.createFile",
            rightClickCommandWrapper((element) => {
                createFileCommand({
                    element,
                });
            })
        )
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(
            "mcsManager.deleteFile",
            rightClickCommandWrapper(deleteFileCommand)
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("mcsManager.refreshRootFile", () =>
            refreshRootFileCommand()
        )
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(
            "mcsManager.refreshFiles",
            rightClickCommandWrapper(refreshFileCommand)
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("mcsManager.openFile", openFileCommand)
    );
    logger.info({
        message: "MCSManager is activated",
    });
}

export function deactivate() {
    GlobalVar.mcsService.clearLoginState();
}
