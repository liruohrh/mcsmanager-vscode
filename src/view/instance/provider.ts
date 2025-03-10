import * as vscode from "vscode";
import { GlobalVar } from "@/utils/global";
import { MCSInstance } from "@/types";

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
        treeItem.tooltip = JSON.stringify(element);
        treeItem.iconPath = new vscode.ThemeIcon(
            element.status === 0 ? "stop" : "play-circle"
        );
        let description = "";
        if (GlobalVar.currentInstance?.instanceUuid === element.instanceUuid) {
            description += "✅";
        }
        description += "\t" + element.hostIp;
        treeItem.description = description;

        treeItem.command = {
            command: "mcsManager.selectInstance",
            title: "Select Instance",
            arguments: [element],
        };
        return treeItem;
    }

    async getChildren(): Promise<MCSInstance[]> {
        if (!(await GlobalVar.mcsService.isLogin2())) {
            return [];
        }
        return GlobalVar.loginUser!.instances;
    }
}
