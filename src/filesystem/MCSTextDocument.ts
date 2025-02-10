import * as vscode from "vscode";
import { GlobalVar } from "@/utils/global";

export class MCSTextDocumentContentProvider
    implements vscode.TextDocumentContentProvider
{
    private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
    onDidChange = this._onDidChange.event;

    async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
        const content = await GlobalVar.mcsService.getFileContent(uri.path);
        return content;
    }
}
