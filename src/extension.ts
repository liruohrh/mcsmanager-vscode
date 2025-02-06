import * as vscode from "vscode";
import { MCSFileTreeDataProvider } from "./providers/MCSFileTreeDataProvider";
import { MCSFileSystemProvider } from "./providers/MCSFileSystemProvider";
import { MCSInstanceTreeDataProvider } from "./providers/MCSInstanceTreeDataProvider";
import { McsService } from "./service/mcs";
import { GlobalVar } from "./utils/global";
import {
    COMMAND_OPEN_FILE,
    COMMAND_REFRESH_FILES,
    openFileCommand,
    refreshFilesCommand,
} from "./commands/files";
import {
    COMMAND_REFRESH_INSTANCES,
    COMMAND_SELECT_INSTANCE,
    refreshInstancesCommand,
    selectInstanceCommand,
} from "./commands/instance";
import { STATE_LOGIN_USER } from "./utils/constant";

export function activate(context: vscode.ExtensionContext) {
    GlobalVar.context = context;
    GlobalVar.mcsService = new McsService();

    // 注册输出面板
    const outputChannel = vscode.window.createOutputChannel("MCSManager", {
        log: true,
    });
    context.subscriptions.push(outputChannel);
    GlobalVar.outputChannel = outputChannel;

    GlobalVar.mcsService.autoLogin().then(async (_) => {
        await afterLogin();
    });
}

async function afterLogin() {
    // 注册MCS文件系统提供者
    const fileSystemProvider = new MCSFileSystemProvider();
    GlobalVar.context.subscriptions.push(
        vscode.workspace.registerFileSystemProvider("mcs", fileSystemProvider, {
            isCaseSensitive: true,
            isReadonly: false,
        })
    );

    // 注册视图

    // 实例视图
    const instanceTreeDataProvider = new MCSInstanceTreeDataProvider();
    vscode.window.registerTreeDataProvider(
        "mcsInstanceExplorer",
        instanceTreeDataProvider
    );

    // 文件视图
    const fileTreeDataProvider = new MCSFileTreeDataProvider();
    vscode.window.registerTreeDataProvider(
        "mcsFileExplorer",
        fileTreeDataProvider
    );

    // 注册命令

    // 选中实例
    GlobalVar.context.subscriptions.push(
        vscode.commands.registerCommand(COMMAND_SELECT_INSTANCE, (instance) => {
            selectInstanceCommand(
                fileTreeDataProvider,
                instanceTreeDataProvider,
                instance
            );
        })
    );

    // 刷新实例
    GlobalVar.context.subscriptions.push(
        vscode.commands.registerCommand(COMMAND_REFRESH_INSTANCES, () => {
            refreshInstancesCommand(
                fileTreeDataProvider,
                instanceTreeDataProvider
            );
        })
    );

    // 刷新文件列表
    GlobalVar.context.subscriptions.push(
        vscode.commands.registerCommand(COMMAND_REFRESH_FILES, () => {
            refreshFilesCommand(fileTreeDataProvider);
        })
    );

    // 打开文件
    GlobalVar.context.subscriptions.push(
        vscode.commands.registerCommand(COMMAND_OPEN_FILE, openFileCommand)
    );

    GlobalVar.outputChannel.info("插件已激活");
}

export function deactivate() {
    GlobalVar.context.globalState.update(STATE_LOGIN_USER, undefined);
    GlobalVar.outputChannel.info("deactivate", {
        authToken: GlobalVar.context.globalState.get<string>("authToken"),
    });
}
