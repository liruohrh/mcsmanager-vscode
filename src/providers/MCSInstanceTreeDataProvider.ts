import * as vscode from "vscode";
import { GlobalVar } from "../utils/global";
import { MCSInstance } from "../types";
import { COMMAND_SELECT_INSTANCE } from "../commands/instance";

export class MCSInstanceTreeDataProvider
    implements vscode.TreeDataProvider<MCSInstance>
{
    private onDidChangeTreeDataEventEmitter: vscode.EventEmitter<
        MCSInstance | undefined | null | void
    > = new vscode.EventEmitter<MCSInstance | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<
        MCSInstance | undefined | null | void
    > = this.onDidChangeTreeDataEventEmitter.event;

    refresh(): void {
        this.onDidChangeTreeDataEventEmitter.fire();
    }

    getTreeItem(element: MCSInstance): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(
            element.nickname,
            vscode.TreeItemCollapsibleState.None
        );
        treeItem.iconPath = new vscode.ThemeIcon(
            element.status === 0 ? "stop" : "play-circle"
        );

        treeItem.command = {
            command: COMMAND_SELECT_INSTANCE,
            title: "Select Instance",
            arguments: [element],
        };

        // 如果是当前选中的实例，添加选中标识
        if (GlobalVar.currentInstance?.instanceUuid === element.instanceUuid) {
            treeItem.description = "✓";
        }

        return treeItem;
    }

    async getChildren(): Promise<MCSInstance[]> {
        if (!GlobalVar.loginUser) {
            return [];
        }
        return GlobalVar.loginUser.instances;
    }
}
