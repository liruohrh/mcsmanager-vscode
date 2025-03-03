import * as vscode from "vscode";
import { GlobalVar } from "@/utils/global";
import { formatTimestamp } from "@/utils/mcs";
import { formatFileSize } from "@/utils/file";
import { Entry, MCSFileSystemProvider } from "@/filesystem/mcs";

export class MCSFileTreeDataProvider implements vscode.TreeDataProvider<Entry> {
    private onDidChangeTreeDataEventEmitter: vscode.EventEmitter<
        Entry | undefined | null | void
    > = new vscode.EventEmitter<Entry | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<
        Entry | undefined | null | void
    > = this.onDidChangeTreeDataEventEmitter.event;

    copyEntries: Entry[] = [];
    cutEntries: Entry[] = [];

    /**
     * 元素必须是同一引用，属性可以不同
     */
    refresh(element?: Entry): void {
        //默认更新root -> 更新所有可展开的节点
        if (element && element.path === "/") {
            element = undefined;
        }
        this.onDidChangeTreeDataEventEmitter.fire(element);
    }

    getTreeItem(element: Entry): vscode.TreeItem {
        const isDir = element.isDir;
        const treeItem = new vscode.TreeItem(element.name);

        const sizeF = isDir ? "0" : formatFileSize(element.size);
        const updateAtF = formatTimestamp(element.mtime);
        treeItem.tooltip = JSON.stringify({
            size: sizeF,
            updateAt: updateAtF,
            mode: element.mode,
        });
        // 必须要有uri才能显示文件类型icon，否则icon只是普通的文件、目录icon
        // 不用icon，有resourceUri也行
        // 以resourceUri构建TreeItem也行，自动推断label
        treeItem.resourceUri = element.uri;
        if (isDir) {
            treeItem.description = updateAtF;
            treeItem.collapsibleState =
                vscode.TreeItemCollapsibleState.Collapsed;
            treeItem.contextValue = "folder";
        } else {
            treeItem.description = `${sizeF} ${updateAtF}`;
            treeItem.collapsibleState = vscode.TreeItemCollapsibleState.None;
            treeItem.contextValue = "file";

            treeItem.command = {
                command: "mcsManager.openFile",
                title: "Open File",
                arguments: [element],
            };
        }

        return treeItem;
    }

    /**
     * 点击不会重新调用getChildren，除非onDidChangeTreeData触发
     */
    async getChildren(element?: Entry): Promise<Entry[]> {
        if (!GlobalVar.currentInstance) {
            return [];
        }
        const uri = element ? element.uri : MCSFileSystemProvider.rootUri;
        return await GlobalVar.fileSystemProvider.readDir(uri);
    }
}
