import { MCSFileItem } from "@/types";
import { GlobalVar } from "@/utils/global";
import * as vscode from "vscode";

export class MCsFileTreeViewDragDropController
    implements vscode.TreeDragAndDropController<MCSFileItem>
{
    dropMimeTypes: readonly string[] = ["files"];
    dragMimeTypes: readonly string[] = ["files"];

    currentDragData: MCSFileItem[] = [];
    handleDrag(
        source: MCSFileItem[],
        dataTransfer: vscode.DataTransfer,
        token: vscode.CancellationToken
    ): Thenable<void> | void {
        this.currentDragData = source;
    }
    async handleDrop(
        target: MCSFileItem | undefined,
        dataTransfer: vscode.DataTransfer,
        token: vscode.CancellationToken
    ): Promise<void> {
        if (!target) {
            return;
        }
        GlobalVar.mcsService.moveFile(this.currentDragData, target);
    }
}
