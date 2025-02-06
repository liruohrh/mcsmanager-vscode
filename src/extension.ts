import * as vscode from "vscode";
import { MCSFileTreeDataProvider } from "./providers/MCSFileTreeDataProvider";
import { MCSFileSystemProvider } from "./providers/MCSFileSystemProvider";
import { McsService } from "./service/mcs";
import { GlobalVar } from "./utils/global";
import { openFileCommand, refreshFilesCommand } from "./commands/files";

export function activate(context: vscode.ExtensionContext) {
    GlobalVar.context = context;
    GlobalVar.mcsService = new McsService();

    // 注册输出面板
    const outputChannel = vscode.window.createOutputChannel("MCSManager", {
        log: true,
    });
    context.subscriptions.push(outputChannel);
    GlobalVar.outputChannel = outputChannel;

    // 注册MCS文件系统提供者
    const fileSystemProvider = new MCSFileSystemProvider();
    context.subscriptions.push(
        vscode.workspace.registerFileSystemProvider("mcs", fileSystemProvider, {
            isCaseSensitive: true,
            isReadonly: false,
        })
    );

    // 注册视图
    const treeDataProvider = new MCSFileTreeDataProvider();
    vscode.window.registerTreeDataProvider("mcsFileExplorer", treeDataProvider);

    // 注册刷新命令
    context.subscriptions.push(
        vscode.commands.registerCommand("mcsManager.refreshFiles", () => {
            refreshFilesCommand(treeDataProvider);
        })
    );
    // 注册文件打开命令
    context.subscriptions.push(
        vscode.commands.registerCommand("mcsManager.openFile", openFileCommand)
    );

    GlobalVar.outputChannel.info("插件已激活");
}

export function deactivate() {
    GlobalVar.outputChannel.info("deactivate", {
        authToken: GlobalVar.context.globalState.get<string>("authToken"),
    });
}
