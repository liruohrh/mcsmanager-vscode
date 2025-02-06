import * as vscode from "vscode";
import { MCSFileTreeDataProvider } from "./providers/MCSFileTreeDataProvider";
import { MCSFileSystemProvider } from "./providers/MCSFileSystemProvider";
import { McsService } from "./service/mcs";
import { GlobalVar } from "./utils/global";
import { logger } from "./utils/log";
import { MCSFileItem, MCSInstance } from "./types";
import { isTextFile } from "./utils/mcs";

export function activate(context: vscode.ExtensionContext) {
    logger.info("插件已激活");
    GlobalVar.context = context;
    GlobalVar.mcsService = new McsService();

    // 注册MCS文件系统提供者
    const fileSystemProvider = new MCSFileSystemProvider();
    context.subscriptions.push(
        vscode.workspace.registerFileSystemProvider(
            "mcs",
            fileSystemProvider,
            { 
                isCaseSensitive: true,
                isReadonly: false
            }
        )
    );

    const treeDataProvider = new MCSFileTreeDataProvider();
    vscode.window.registerTreeDataProvider("mcsFileExplorer", treeDataProvider);

    // 注册文件打开命令
    context.subscriptions.push(
        vscode.commands.registerCommand(
            "mcsManager.openFile",
            async (fileItem: MCSFileItem, instance: MCSInstance) => {
                if (!instance) {
                    vscode.window.showErrorMessage("No instance selected");
                    return;
                }

                // 检查是否是文本文件
                if (!isTextFile(fileItem.path)) {
                    const result = await vscode.window.showWarningMessage(
                        `此文件类型无法直接查看。是否需要下载？`,
                        "是",
                        "否"
                    );

                    if (result === "是") {
                        const uri = await vscode.window.showSaveDialog({
                            defaultUri: vscode.Uri.file(fileItem.path),
                            filters: {
                                "All Files": ["*"],
                            },
                        });

                        if (uri) {
                            // TODO: 实现文件下载
                            vscode.window.showInformationMessage(
                                `文件将下载到: ${uri.fsPath}`
                            );
                        }
                    }
                    return;
                }

                // 创建mcs scheme的URI
                const uri = vscode.Uri.parse(
                    `mcs:${fileItem.path}?daemonId=${instance.daemonId}&uuid=${instance.instanceUuid}`
                );

                // 打开文档
                const doc = await vscode.workspace.openTextDocument(uri);
                await vscode.window.showTextDocument(doc, {
                    preview: false,
                });
            }
        )
    );

    //cmd
    context.subscriptions.push(
        vscode.commands.registerCommand("mcsManager.login", () =>
            GlobalVar.mcsService.login()
        )
    );
}

export function deactivate() {
    logger.info("deactivate");
    logger.info({
        authToken: GlobalVar.context.globalState.get<string>("authToken"),
    });
}
