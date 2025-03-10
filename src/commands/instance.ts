import * as vscode from "vscode";
import { GlobalVar } from "@/utils/global";
import { MCSInstance } from "@/types";
import { STATE_SELECTED_INSTANCE } from "@/utils/constant";

export async function copyInstancesCommand(element: MCSInstance) {
    vscode.env.clipboard.writeText(JSON.stringify(element));
    vscode.window.showInformationMessage("Copy instance to clipboard");
}

export async function refreshInstancesCommand() {
    const loginUser = await GlobalVar.mcsService.getLoginUser();
    await GlobalVar.mcsService.onLogin(loginUser);
    GlobalVar.instanceTreeDataProvider.refresh();
    GlobalVar.fileTreeDataProvider.refresh();
    GlobalVar.outputChannel.info("Instances refreshed");
}

export async function selectInstanceCommand(instance: MCSInstance) {
    GlobalVar.currentInstance = instance;
    await GlobalVar.context.globalState.update(
        STATE_SELECTED_INSTANCE,
        instance
    );
    GlobalVar.instanceTreeDataProvider.refresh();
    GlobalVar.fileTreeDataProvider.refresh();
    const message = `选中实例: ${instance.nickname}`;
    GlobalVar.outputChannel.info(message);
    await vscode.window.showInformationMessage(message);
    vscode.commands.executeCommand(
        "setContext",
        "mcsManager.hasSelectedInstance",
        true
    );
}
