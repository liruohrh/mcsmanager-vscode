import * as vscode from "vscode";
import { MCSFileTreeDataProvider } from "@/view/file/provider";
import { MCSFileSystemProvider } from "@/filesystem/mcs";
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
    COMMAND_BATCH_DELETE_FILES,
    COMMAND_CREATE_FILE,
    createFileCommand,
    COMMAND_CREATE_FILE_IN_ROOT,
    COMMAND_CREATE_DIR_IN_ROOT,
    COMMAND_CREATE_DIR,
    COMMAND_DOWNLOAD_FILE,
    downloadFileCommand,
    COMMAND_UPLOAD_FILE,
    uploadFileCommand,
    COMMAND_UPLOAD_FILE_TO_ROOT,
} from "./commands/files";
import {
    COMMAND_REFRESH_INSTANCES,
    COMMAND_SELECT_INSTANCE,
    refreshInstancesCommand,
    selectInstanceCommand,
} from "./commands/instance";
import {
    COMMAND_LOGIN,
    COMMAND_LOGOUT,
    COMMAND_OPEN_CONFIG,
    loginCommand,
    logoutCommand,
    openConfigCommand,
} from "./commands/auth";
import { MCSFileItem } from "./types";
import { MCsFileTreeViewDragDropController } from "./view/file/DragDropController";

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
    const mcsFileExplorer = vscode.window.createTreeView<MCSFileItem>(
        "mcsFileExplorer",
        {
            treeDataProvider: fileTreeDataProvider,
            canSelectMany: true,
            showCollapseAll: true,
            dragAndDropController: new MCsFileTreeViewDragDropController(),
        }
    );
    context.subscriptions.push(mcsFileExplorer);

    // 注册命令

    context.subscriptions.push(
        vscode.commands.registerCommand(COMMAND_OPEN_CONFIG, openConfigCommand)
    );

    // 登录相关
    context.subscriptions.push(
        vscode.commands.registerCommand(COMMAND_LOGIN, () => {
            loginCommand(fileTreeDataProvider, instanceTreeDataProvider);
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(COMMAND_LOGOUT, () => {
            logoutCommand(fileTreeDataProvider, instanceTreeDataProvider);
        })
    );

    // 实例
    context.subscriptions.push(
        vscode.commands.registerCommand(COMMAND_SELECT_INSTANCE, (instance) => {
            selectInstanceCommand(
                fileTreeDataProvider,
                instanceTreeDataProvider,
                instance
            );
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(COMMAND_REFRESH_INSTANCES, () => {
            refreshInstancesCommand(
                fileTreeDataProvider,
                instanceTreeDataProvider
            );
        })
    );

    // 文件
    context.subscriptions.push(
        vscode.commands.registerCommand(COMMAND_UPLOAD_FILE_TO_ROOT, () => {
            uploadFileCommand({ fileTreeDataProvider });
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(COMMAND_UPLOAD_FILE, (element) => {
            uploadFileCommand({ element, fileTreeDataProvider });
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(COMMAND_DOWNLOAD_FILE, (element) => {
            downloadFileCommand({
                element,
            });
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(COMMAND_CREATE_DIR_IN_ROOT, () => {
            createFileCommand({
                isDir: true,
                fileTreeDataProvider,
            });
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(COMMAND_CREATE_DIR, (element) => {
            createFileCommand({
                isDir: true,
                element,
                fileTreeDataProvider,
            });
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(COMMAND_CREATE_FILE_IN_ROOT, () => {
            createFileCommand({
                fileTreeDataProvider,
            });
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(COMMAND_CREATE_FILE, (element) => {
            createFileCommand({
                element,
                fileTreeDataProvider,
            });
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(COMMAND_BATCH_DELETE_FILES, () => {
            deleteFilesCommand({
                mcsFileExplorer,
                fileTreeDataProvider,
            });
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(COMMAND_DELETE_FILES, (element) => {
            deleteFilesCommand({
                element,
                fileTreeDataProvider,
            });
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(COMMAND_REFRESH_FILE_ROOT, () => {
            refreshFileRootCommand(fileTreeDataProvider);
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(COMMAND_REFRESH_FILES, (element) => {
            refreshFilesCommand(element, fileTreeDataProvider);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(COMMAND_OPEN_FILE, openFileCommand)
    );

    GlobalVar.outputChannel.info("插件已激活");
}

export function deactivate() {
    GlobalVar.mcsService.clearLoginState();
}
