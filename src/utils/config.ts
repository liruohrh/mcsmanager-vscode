import * as vscode from "vscode";
import { ServiceConfig } from "@/types";
import { GlobalVar } from "./global";
import { logger } from "./log";

export const CONFIG_SECTION = "mcsManager";

export const getConfig = () =>
    vscode.workspace.getConfiguration(CONFIG_SECTION);

export const Config: ServiceConfig = {
    get urlPrefix(): string {
        return getConfig().get<string>("urlPrefix") || "";
    },
    get apiKey(): string {
        return getConfig().get<string>("apiKey") || "";
    },
};

export function onConfigChange() {
    return vscode.workspace.onDidChangeConfiguration(async (e) => {
        if (e.affectsConfiguration(CONFIG_SECTION)) {
            logger.info2(`${CONFIG_SECTION} config changed, relogin`);
            await GlobalVar.mcsService.autoLogin();
            GlobalVar.instanceTreeDataProvider.refresh();
        }
    });
}
