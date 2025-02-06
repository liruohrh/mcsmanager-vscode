import * as vscode from "vscode";
import { GlobalVar } from "../utils/global";
import { MCSInstance } from "../types";
import { MCSInstanceTreeDataProvider } from "../providers/MCSInstanceTreeDataProvider";
import { MCSFileTreeDataProvider } from "../providers/MCSFileTreeDataProvider";
import { STATE_SELECTED_INSTANCE } from "../utils/constant";

export const COMMAND_REFRESH_INSTANCES = "mcsManager.refreshInstances";
export const COMMAND_SELECT_INSTANCE = "mcsManager.selectInstance";

export async function refreshInstancesCommand(
    fileTreeDataProvider: MCSFileTreeDataProvider,
    instanceTreeDataProvider: MCSInstanceTreeDataProvider
) {
    const loginUser = await GlobalVar.mcsService.getLoginUser();
    if (!loginUser) {
        throw Error("获取用户信息失败");
    }
    GlobalVar.mcsService.onLogin(loginUser);
    instanceTreeDataProvider.refresh();
    fileTreeDataProvider.refresh();
    GlobalVar.outputChannel.info("Instances refreshed");
}

export async function selectInstanceCommand(
    fileTreeDataProvider: MCSFileTreeDataProvider,
    instanceTreeDataProvider: MCSInstanceTreeDataProvider,
    instance: MCSInstance
) {
    GlobalVar.currentInstance = instance;
    GlobalVar.context.globalState.update(STATE_SELECTED_INSTANCE, instance);
    instanceTreeDataProvider.refresh();
    fileTreeDataProvider.refresh();
    const message = `选中实例: ${instance.nickname}`;
    GlobalVar.outputChannel.info(message);
    await vscode.window.showInformationMessage(message);
}
