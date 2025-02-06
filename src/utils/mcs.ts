import { MCSFileItem } from "../types";
import { GlobalVar } from "./global";

export function buildMCSUrl({
    daemonId,
    uuid,
    path,
}: {
    daemonId?: string;
    uuid?: string;
    path: string;
}): string {
    const currentInstance = GlobalVar.currentInstance;
    if (!daemonId) {
        daemonId = currentInstance?.daemonId;
    }
    if (!uuid) {
        uuid = currentInstance?.instanceUuid;
    }
    return `mcs://${path}?daemonId=${daemonId}&uuid=${uuid}`;
}

// 文本文件扩展名列表
const TEXT_EXTENSIONS = [
    ".txt",
    ".log",
    ".cfg",
    ".conf",
    ".config",
    ".ini",
    ".properties",
    ".json",
    ".yml",
    ".yaml",
    ".xml",
    ".html",
    ".htm",
    ".css",
    ".js",
    ".ts",
    ".md",
    ".markdown",
    ".sh",
    ".bat",
    ".cmd",
    ".ps1",
    ".java",
    ".py",
    ".rb",
    ".php",
    ".c",
    ".cpp",
    ".h",
    ".hpp",
];

export function isTextFile(filename: string): boolean {
    const ext = getFileExtension(filename).toLowerCase();
    return TEXT_EXTENSIONS.includes(ext);
}

export function getFileExtension(filename: string): string {
    const i = filename.lastIndexOf(".");
    if (i !== -1) {
        return filename.substring(i);
    }
    return "";
}

export function isDirectory(item: MCSFileItem): boolean {
    return item.type === 0;
}

export function isFile(item: MCSFileItem): boolean {
    return item.type === 1;
}

export function formatFileSize(size: number): string {
    if (size < 1024) {
        return `${size} B`;
    } else if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} KB`;
    } else if (size < 1024 * 1024 * 1024) {
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    } else {
        return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }
}

export function formatDateTime(dateStr: string): string {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");
    const second = String(date.getSeconds()).padStart(2, "0");
    const timezone = String(-(date.getTimezoneOffset() / 60));

    return `${year}/${month}/${day}-${hour}:${minute}:${second}+${timezone}`;
}
