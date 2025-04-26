import * as vscode from "vscode";
import { ServiceConfig } from "@/types";

export const getConfig = () => vscode.workspace.getConfiguration("mcsManager");

export const Config: ServiceConfig = {
    get urlPrefix(): string {
        return getConfig().get<string>("urlPrefix") || "";
    },
    get apiKey(): string {
        return getConfig().get<string>("apiKey") || "";
    }
};
