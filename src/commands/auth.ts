import * as vscode from "vscode";
import { GlobalVar } from "@/utils/global";
import { logger } from "@/utils/log";

export async function logoutCommand() {
    await GlobalVar.mcsService.logout();
    GlobalVar.fileTreeDataProvider.refresh();
    GlobalVar.instanceTreeDataProvider.refresh();
    vscode.window.showInformationMessage(`Success to logout`);
}

export async function loginCommand() {
    if (GlobalVar.isSigningIn) {
        logger.info({
            message:
                "Logging in. Please wait a moment before proceeding with the login.",
        });
        return;
    }
    const isLogin = await GlobalVar.mcsService.isLogin2();
    await GlobalVar.mcsService.login();
    GlobalVar.fileTreeDataProvider.refresh();
    GlobalVar.instanceTreeDataProvider.refresh();
    vscode.window.showInformationMessage(
        `${isLogin ? "Sucess to Relogin" : "Sucess to login"}`
    );
}

export async function openConfigCommand() {
    await vscode.commands.executeCommand(
        "workbench.action.openSettings",
        "mcsManager"
    );
}
