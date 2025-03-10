import * as vscode from "vscode";
import { GlobalVar } from "@/utils/global";
interface LoggerArgs {
    message: string;
    args?: any[];
}
export const logger = {
    info({ message, args }: LoggerArgs) {
        GlobalVar.outputChannel.info(message, ...(args ?? []));
    },
    terror({
        message,
        args,
        errorGetter = defaultErrorGetter,
    }: {
        message: string;
        args?: any[];
        errorGetter?: (messageOrUri: string) => Error;
    }): Error {
        GlobalVar.outputChannel.error(message, ...(args ?? []));
        return errorGetter(message);
    },
};
export const defaultErrorGetter = (message: string) => new Error(message);
export const defaultFileErrorGetter = (message: string) =>
    new vscode.FileSystemError(message);
