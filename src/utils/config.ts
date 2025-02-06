import * as vscode from "vscode";
import { ServiceConfig } from "../types";

export const getConfig = () => vscode.workspace.getConfiguration("mcsManager");

export const Config: ServiceConfig = {
    get urlPrefix(): string {
        return getConfig().get<string>("urlPrefix") || "";
    },
    get username(): string {
        return getConfig().get<string>("username") || "";
    },
    get password(): string {
        return getConfig().get<string>("password") || "";
    },
    get autoLogin(): boolean {
        return getConfig().get<boolean>("autoLogin") || true;
    },
    get apiKey(): string {
        return getConfig().get<string>("apiKey") || "";
    },
};
