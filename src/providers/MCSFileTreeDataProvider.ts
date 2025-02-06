import * as vscode from "vscode";
import { GlobalVar } from "../utils/global";
import { STATE_LOGIN_USER } from "../utils/constant";
import { MCSFileItem, MCSLoginUser, MCSInstance } from "../types";
import { isDirectory, isFile } from "../utils/mcs";
import { Config } from "../utils/config";
import { COMMAND_OPEN_FILE } from "../commands/files";

export class MCSFileTreeDataProvider
    implements vscode.TreeDataProvider<MCSFileItem>
{
    private onDidChangeTreeDataEventEmitter: vscode.EventEmitter<
        MCSFileItem | undefined | null | void
    > = new vscode.EventEmitter<MCSFileItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<
        MCSFileItem | undefined | null | void
    > = this.onDidChangeTreeDataEventEmitter.event;

    refresh(): void {
        //更新root -> 更新所有可展开的节点
        this.onDidChangeTreeDataEventEmitter.fire();
    }

    getTreeItem(element: MCSFileItem): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(
            element.name,
            isDirectory(element)
                ? vscode.TreeItemCollapsibleState.Collapsed
                : vscode.TreeItemCollapsibleState.None
        );

        treeItem.contextValue = isDirectory(element) ? "directory" : "file";
        treeItem.iconPath = isDirectory(element)
            ? new vscode.ThemeIcon("folder")
            : new vscode.ThemeIcon("file");

        if (isFile(element)) {
            treeItem.command = {
                command: COMMAND_OPEN_FILE,
                title: "Open File",
                arguments: [element, GlobalVar.currentInstance],
            };
        }

        return treeItem;
    }

    async getChildren(element?: MCSFileItem): Promise<MCSFileItem[]> {
        if (!Config.apiKey || !GlobalVar.currentInstance) {
            return [];
        }

        const currentPath = element ? element.path : "/";

        const fileList = await GlobalVar.mcsService.getAllFileList({
            daemonId: GlobalVar.currentInstance.daemonId,
            uuid: GlobalVar.currentInstance.instanceUuid,
            target: currentPath,
        });

        return fileList?.data || [];
    }
}
