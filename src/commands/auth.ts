import * as vscode from "vscode";
import { GlobalVar } from "@/utils/global";

export const COMMAND_LOGIN = "mcsManager.login";
export const COMMAND_LOGOUT = "mcsManager.logout";
export const COMMAND_OPEN_CONFIG = "mcsManager.openConfig";

export async function logoutCommand() {
    await GlobalVar.mcsService.logout();
    GlobalVar.fileTreeDataProvider.refresh();
    GlobalVar.instanceTreeDataProvider.refresh();
    vscode.window.showInformationMessage(`登出成功`);
}

export async function loginCommand() {
    if (GlobalVar.isSigningIn) {
        GlobalVar.outputChannel.info(
            "Command[login]: 正在登录中，请稍后执行登录"
        );
        return;
    }
    const isLogin = await GlobalVar.mcsService.isLogin2();
    await GlobalVar.mcsService.login();
    GlobalVar.fileTreeDataProvider.refresh();
    GlobalVar.instanceTreeDataProvider.refresh();
    vscode.window.showInformationMessage(`${isLogin ? "重新" : ""}登录成功`);
}

export async function openConfigCommand() {
    await vscode.commands.executeCommand(
        "workbench.action.openSettings",
        "mcsManager"
    );
}
