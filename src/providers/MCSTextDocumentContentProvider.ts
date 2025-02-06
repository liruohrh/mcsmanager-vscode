import * as vscode from "vscode";
import { logger } from "../utils/log";
import { GlobalVar } from "../utils/global";

export class MCSTextDocumentContentProvider
    implements vscode.TextDocumentContentProvider
{
    private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
    onDidChange = this._onDidChange.event;

    async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
        try {
            const params = new URLSearchParams(uri.query);
            const daemonId = params.get("daemonId");
            const uuid = params.get("uuid");

            if (!daemonId || !uuid) {
                throw new Error("Missing required parameters");
            }

            const content = await GlobalVar.mcsService.getFileContent(
                daemonId,
                uuid,
                uri.path
            );
            if (content === true) {
                return "";
            }

            return content || "";
        } catch (error) {
            logger.error("Failed to provide content:", error);
            return "";
        }
    }
}
