import * as vscode from "vscode";
import { GlobalVar } from "../utils/global";
import { STATE_LOGIN_USER } from "../utils/constant";
import { MCSFileItem, MCSLoginUser, MCSInstance } from "../types";
import { isDirectory, isFile } from "../utils/mcs";
import { Config } from "../utils/config";

export class MCSFileTreeDataProvider
    implements vscode.TreeDataProvider<MCSFileItem>
{
    private _onDidChangeTreeData: vscode.EventEmitter<
        MCSFileItem | undefined | null | void
    > = new vscode.EventEmitter<MCSFileItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<
        MCSFileItem | undefined | null | void
    > = this._onDidChangeTreeData.event;
    private currentInstance?: MCSInstance;

    constructor() {
        // 初始化时选择第一个实例
        const loginUser =
            GlobalVar.context.globalState.get<MCSLoginUser>(STATE_LOGIN_USER);
        if (loginUser && loginUser.instances.length > 0) {
            this.currentInstance = loginUser.instances[0];
        }
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
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
                command: "mcsManager.openFile",
                title: "Open File",
                arguments: [element, this.currentInstance],
            };
        }

        return treeItem;
    }

    async getChildren(element?: MCSFileItem): Promise<MCSFileItem[]> {
        if (!Config.apiKey || !this.currentInstance) {
            return [];
        }

        const currentPath = element ? element.path : "/";

        const fileList = await GlobalVar.mcsService.getFileList({
            daemonId: this.currentInstance.daemonId,
            uuid: this.currentInstance.instanceUuid,
            target: currentPath,
        });

        return fileList?.items || [];
    }
}
