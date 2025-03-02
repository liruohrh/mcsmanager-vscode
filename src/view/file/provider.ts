import * as vscode from "vscode";
import { GlobalVar } from "@/utils/global";
import { buildMCSUrl, formatTimestamp } from "@/utils/mcs";
import { formatFileSize } from "@/utils/file";
import { COMMAND_OPEN_FILE } from "@/commands/files";
import { Entry } from "@/filesystem/mcs";

export class MCSFileTreeDataProvider implements vscode.TreeDataProvider<Entry> {
    private onDidChangeTreeDataEventEmitter: vscode.EventEmitter<
        Entry | undefined | null | void
    > = new vscode.EventEmitter<Entry | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<
        Entry | undefined | null | void
    > = this.onDidChangeTreeDataEventEmitter.event;

    /**
     * 元素必须是同一引用，属性可以不同
     */
    refresh(element?: Entry): void {
        //默认更新root -> 更新所有可展开的节点
        this.onDidChangeTreeDataEventEmitter.fire(element);
    }

    getTreeItem(element: Entry): vscode.TreeItem {
        const isDir = element.isDir;
        const treeItem = new vscode.TreeItem(element.name);

        const sizeF = isDir ? "0" : formatFileSize(element.size);
        const updateAtF = formatTimestamp(element.mtime);
        treeItem.tooltip = JSON.stringify({
            sizeF: sizeF,
            updateAtF: updateAtF,
            mode: element.mode,
        });
        // 必须要有uri才能显示文件类型icon，否则icon只是普通的文件、目录icon
        // 不用icon，有resourceUri也行
        // 以resourceUri构建TreeItem也行，自动推断label
        treeItem.resourceUri = vscode.Uri.parse(
            buildMCSUrl({
                path: element.path,
            })
        );
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
                command: COMMAND_OPEN_FILE,
                title: "Open File",
                arguments: [element, GlobalVar.currentInstance],
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
        const uri = vscode.Uri.parse(
            buildMCSUrl({ path: element ? element.path : "/" })
        );
        return await GlobalVar.fileSystemProvider.readDir(uri);
    }
}
