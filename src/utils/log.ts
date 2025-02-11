import * as vscode from "vscode";
import { GlobalVar } from "@/utils/global";

export const logger = {
    terror({
        message,
        args,
        errorGetter = defaultErrorGetter,
    }: {
        message: string;
        args?: any[];
        errorGetter?: (messageOrUri: string) => Error;
    }): Error {
        if (args) {
            GlobalVar.outputChannel.error(message, args);
        } else {
            GlobalVar.outputChannel.error(message);
        }
        return errorGetter(message);
    },
};
export const defaultErrorGetter = (message: string) => new Error(message);
export const defaultFileErrorGetter = (message: string) =>
    new vscode.FileSystemError(message);
