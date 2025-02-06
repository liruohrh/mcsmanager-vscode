import * as vscode from "vscode";
import { MCSFileItem, MCSInstance } from "../types";
import { isTextFile } from "../utils/mcs";
import { MCSFileTreeDataProvider } from "../providers/MCSFileTreeDataProvider";
import { GlobalVar } from "../utils/global";

export const COMMAND_REFRESH_FILES = "mcsManager.refreshFiles";
export const COMMAND_OPEN_FILE =     "mcsManager.openFile";

export function refreshFilesCommand(treeDataProvider: MCSFileTreeDataProvider) {
    treeDataProvider.refresh();
    GlobalVar.outputChannel.info("Files view refreshed");
}

export async function openFileCommand(
    fileItem: MCSFileItem,
    instance: MCSInstance
) {
    if (!instance) {
        throw Error("require instance");
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
