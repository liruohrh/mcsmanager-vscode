import { MCSFileItem } from "../types";

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
