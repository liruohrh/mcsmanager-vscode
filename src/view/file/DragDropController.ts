import { Entry } from "@/filesystem/mcs";
import { GlobalVar } from "@/utils/global";
import path from "path";
import * as vscode from "vscode";

export class MCsFileTreeViewDragDropController
    implements vscode.TreeDragAndDropController<Entry>
{
    dropMimeTypes: readonly string[] = ["files"];
    dragMimeTypes: readonly string[] = ["files"];

    currentDragData: Entry[] = [];
    handleDrag(
        source: Entry[],
        dataTransfer: vscode.DataTransfer,
        token: vscode.CancellationToken
    ): Thenable<void> | void {
        this.currentDragData = source;
    }
    async handleDrop(
        target: Entry | undefined,
        dataTransfer: vscode.DataTransfer,
        token: vscode.CancellationToken
    ): Promise<void> {
        if (!target || this.currentDragData.length === 0) {
            return;
        }
        let targetDirPath = target.path;
        if (!target.isDir) {
            targetDirPath = path.dirname(target.path);
            const result = await vscode.window.showErrorMessage(
                `Can't move multiple files to a file, Whether to change target dir ${target.path} to ${targetDirPath}`,
                "Yes",
                "No"
            );
            if (result !== "Yes") {
                return;
            }
        }
        GlobalVar.fileSystemProvider.move(
            this.currentDragData.map((e) => e.path),
            targetDirPath
        );
        vscode.window.showInformationMessage("Move success");
    }
}
