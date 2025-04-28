import * as vscode from "vscode";
import { GlobalVar } from "@/utils/global";
import { MCSInstance } from "@/types";
import {
    CONTEXT_HAS_SELECTED_INSTANCE,
    STATE_SELECTED_INSTANCE,
} from "@/utils/constant";
import { logger } from "@/utils/log";
import { TerminalView } from "@/view/TerminalView";
import { isInstanceRunning } from "@/utils/mcs";
import {
    openInstance,
    restartInstance,
    stopInstance,
} from "@/api/mcs/instance";

export async function restartInstanceCommand(element: MCSInstance) {
    if (!isInstanceRunning(element.status)) {
        vscode.window.showErrorMessage("can not restart a stopped instance");
        return;
    }
    const resp = await restartInstance({
        daemonId: element.daemonId,
        uuid: element.instanceUuid,
    });
    if (resp.base.code !== 0) {
        vscode.window.showErrorMessage("fail to restart instance");
        logger.terror({
            message: "restart instance failed",
            args: [resp.base],
        });
        return;
    }
    restartInstanceCommand(element);
    vscode.window.showInformationMessage("success to restart instance");
}

export async function stopInstanceCommand(element: MCSInstance) {
    if (!isInstanceRunning(element.status)) {
        vscode.window.showErrorMessage("Instance is already stopped");
        return;
    }
    const resp = await stopInstance({
        daemonId: element.daemonId,
        uuid: element.instanceUuid,
    });
    if (resp.base.code !== 0) {
        vscode.window.showErrorMessage("fail to stop instance");
        logger.terror({
            message: "stop instance failed",
            args: [resp.base],
        });
        return;
    }
    refreshInstancesCommand();
    vscode.window.showInformationMessage("success to stop instance");
}

export async function openInstanceCommand(element: MCSInstance) {
    if (isInstanceRunning(element.status)) {
        vscode.window.showErrorMessage("Instance is already running");
        return;
    }
    const resp = await openInstance({
        daemonId: element.daemonId,
        uuid: element.instanceUuid,
    });
    if (resp.base.code !== 0) {
        vscode.window.showErrorMessage("fail to open instance");
        logger.terror({
            message: "open instance failed",
            args: [resp.base],
        });
        return;
    }
    refreshInstancesCommand();
    vscode.window.showInformationMessage("success to open instance");
}

export async function openInstanceTerminalCommand(element: MCSInstance) {
    if (!isInstanceRunning(element.status)) {
        vscode.window.showWarningMessage("Instance is not running");
        // return;
    }
    TerminalView.createOrShow({
        daemonId: element.daemonId,
        instanceId: element.instanceUuid,
        instanceName: element.nickname,
    });
}

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
