import * as vscode from "vscode";

export class MCSFileTreeView
    implements vscode.TreeDataProvider<vscode.TreeItem>
{
    private _onDidChangeTreeData = new vscode.EventEmitter<void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
        if (!element) {
            return this.getInstanceItems();
        }
        return this.getFileItems(element);
    }

    private async getInstanceItems(): Promise<vscode.TreeItem[]> {
        return [new vscode.TreeItem("实例1")];
    }

    private async getFileItems(
        parent: vscode.TreeItem
    ): Promise<vscode.TreeItem[]> {
        return [new vscode.TreeItem("文件示例")];
    }
}
