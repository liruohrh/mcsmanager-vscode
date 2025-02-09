import * as vscode from "vscode";
import { GlobalVar } from "@/utils/global";
import { MCSFileTreeDataProvider } from "@/view/file/provider";
import { MCSInstanceTreeDataProvider } from "@/view/instance/provider";

export const COMMAND_LOGIN = "mcsManager.login";
export const COMMAND_LOGOUT = "mcsManager.logout";
export const COMMAND_OPEN_CONFIG = "mcsManager.openConfig";

export async function logoutCommand(
    fileTreeDataProvider: MCSFileTreeDataProvider,
    instanceTreeDataProvider: MCSInstanceTreeDataProvider
) {
    await GlobalVar.mcsService.logout();
    await fileTreeDataProvider.refresh();
    await instanceTreeDataProvider.refresh();
    vscode.window.showInformationMessage(`登出成功`);
}

export async function loginCommand(
    fileTreeDataProvider: MCSFileTreeDataProvider,
    instanceTreeDataProvider: MCSInstanceTreeDataProvider
) {
    const isLogin = await GlobalVar.mcsService.isLogin2();
    await GlobalVar.mcsService.login();
    await fileTreeDataProvider.refresh();
    await instanceTreeDataProvider.refresh();
    vscode.window.showInformationMessage(`${isLogin ? "重新" : ""}登录成功`);
}

export async function openConfigCommand() {
    await vscode.commands.executeCommand(
        "workbench.action.openSettings",
        "mcsManager"
    );
}
