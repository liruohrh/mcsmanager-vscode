import * as vscode from "vscode";
import { MCSFileItem } from "@/types";

export function isInMCSWorkspace(): boolean {
    return (
        vscode.workspace.workspaceFolders?.some(
            (folder) => folder.uri.scheme === "mcs"
        ) ?? false
    );
}
export function getItemType(isDir: boolean): number {
    return isDir ? 0 : 1;
}
export function isDirectory(item: MCSFileItem): boolean {
    return item.type === 0;
}

export function isFile(item: MCSFileItem): boolean {
    return item.type === 1;
}
export function formatTimestamp(tiemstampMills: number): string {
    return formatDateTime(new Date(tiemstampMills));
}
export function formatDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");
    const second = String(date.getSeconds()).padStart(2, "0");
    const timezone = String(-(date.getTimezoneOffset() / 60));

    return `${year}-${month}-${day} ${hour}:${minute}:${second}+${timezone}`;
}
/**
 *
 * @param str Fri Feb 07 2025 14:59:32 GMT+0800 (中国标准时间)
 * @returns
 */
export function fromMCSDatetime(str: string): Date {
    return new Date(str);
}
