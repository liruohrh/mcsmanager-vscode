import * as vscode from "vscode";

export async function openConfigCommand() {
    await vscode.commands.executeCommand(
        "workbench.action.openSettings",
        "mcsManager"
    );
}
