import * as vscode from "vscode";
import { GlobalVar } from "@/utils/global";
import { MCSFileItem, MCSLoginUser, MCSInstance } from "@//types";
import {
    isDirectory,
    formatDateTime,
    buildMCSUrl,
    fromMCSDatetime,
} from "@/utils/mcs";
import { formatFileSize } from "@/utils/file";
import { COMMAND_OPEN_FILE } from "@/commands/files";

export class MCSFileTreeDataProvider
    implements vscode.TreeDataProvider<MCSFileItem>
{
    private onDidChangeTreeDataEventEmitter: vscode.EventEmitter<
        MCSFileItem | undefined | null | void
    > = new vscode.EventEmitter<MCSFileItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<
        MCSFileItem | undefined | null | void
    > = this.onDidChangeTreeDataEventEmitter.event;

    refresh(element?: MCSFileItem): void {
        //默认更新root -> 更新所有可展开的节点
        this.onDidChangeTreeDataEventEmitter.fire(element);
    }

    getTreeItem(element: MCSFileItem): vscode.TreeItem {
        const isDir = isDirectory(element);
        const treeItem = new vscode.TreeItem(element.name);

        const sizeF = isDir ? "0" : formatFileSize(element.size);
        const updateAtF = formatDateTime(element.time);
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
                isDir: isDir,
                mtime: fromMCSDatetime(element.time).getTime(),
                size: element.size,
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
    async getChildren(element?: MCSFileItem): Promise<MCSFileItem[]> {
        if (
            !(await GlobalVar.mcsService.isLogin2()) ||
            !GlobalVar.currentInstance
        ) {
            return [];
        }

        const currentPath = element ? element.path : "/";

        const page = await GlobalVar.mcsService.getAllFileList({
            daemonId: GlobalVar.currentInstance.daemonId,
            uuid: GlobalVar.currentInstance.instanceUuid,
            target: currentPath,
        });

        await GlobalVar.fileSystemProvider._setEntries(currentPath, page.data!);

        return page.data!;
    }
}
