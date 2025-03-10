import * as vscode from "vscode";
import { GlobalVar } from "@/utils/global";
import { MCSInstance } from "@/types";
import {
    CONTEXT_HAS_SELECTED_INSTANCE,
    STATE_SELECTED_INSTANCE,
} from "@/utils/constant";
import { logger } from "@/utils/log";

export async function copyInstancesCommand(element: MCSInstance) {
    vscode.env.clipboard.writeText(JSON.stringify(element));
    vscode.window.showInformationMessage("Copy instance to clipboard");
}

export async function refreshInstancesCommand() {
    const loginUser = await GlobalVar.mcsService.getLoginUser();
    await GlobalVar.mcsService.onLogin(loginUser);
    GlobalVar.instanceTreeDataProvider.refresh();
    GlobalVar.fileTreeDataProvider.refresh();
    logger.info({
        message: "Instances refreshed",
    });
}

export async function selectInstanceCommand(instance: MCSInstance) {
    GlobalVar.currentInstance = instance;
    GlobalVar.fileSystemProvider.root.entries.clear();
    await GlobalVar.context.globalState.update(
        STATE_SELECTED_INSTANCE,
        instance
    );
    GlobalVar.instanceTreeDataProvider.refresh();
    GlobalVar.fileTreeDataProvider.refresh();
    const message = `select instance of ${instance.nickname}`;
    logger.info({
        message,
    });
    await vscode.window.showInformationMessage(message);
    vscode.commands.executeCommand(
        "setContext",
        CONTEXT_HAS_SELECTED_INSTANCE,
        true
    );
}
