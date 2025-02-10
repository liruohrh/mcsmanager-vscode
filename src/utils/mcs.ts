import { MCSFileItem } from "@/types";
import { GlobalVar } from "@/utils/global";

export function buildMCSUrl({
    daemonId,
    uuid,
    isDir = false,
    mtime = 0,
    size = 0,
    path,
    pathOnly = false,
}: {
    daemonId?: string;
    uuid?: string;
    isDir?: boolean;
    mtime?: number;
    size?: number;
    path: string;
    pathOnly?: boolean;
}): string {
    if (pathOnly) {
        return `mcs://${path}`;
    }
    const currentInstance = GlobalVar.currentInstance;
    if (!daemonId) {
        daemonId = currentInstance?.daemonId;
    }
    if (!uuid) {
        uuid = currentInstance?.instanceUuid;
    }
    return `mcs://${path}?daemonId=${daemonId}&uuid=${uuid}&isDir=${isDir}&mtime=${mtime}&size=${size}`;
}

export function isDirectory(item: MCSFileItem): boolean {
    return item.type === 0;
}

export function isFile(item: MCSFileItem): boolean {
    return item.type === 1;
}

export function formatDateTime(str: string): string {
    const date = fromMCSDatetime(str);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");
    const second = String(date.getSeconds()).padStart(2, "0");
    const timezone = String(-(date.getTimezoneOffset() / 60));

    return `${year}/${month}/${day}-${hour}:${minute}:${second}+${timezone}`;
}
/**
 *
 * @param str Fri Feb 07 2025 14:59:32 GMT+0800 (中国标准时间)
 * @returns
 */
export function fromMCSDatetime(str: string): Date {
    return new Date(str);
}
