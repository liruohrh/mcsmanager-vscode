import * as vscode from "vscode";
import { GlobalVar } from "@/utils/global";
import { buildMCSUrl, fromMCSDatetime, isDirectory } from "@/utils/mcs";
import path from "path";
import { MCSFileItem } from "@/types";

class Entry {
    isDir: boolean;
    entries: Map<string, Entry>;
    name: string;
    path: string; // 文件的完整路径
    mtime: number;
    size: number;
    mode: number;
    constructor({
        filepath,
        isDir,
        mtime = 0,
        size = 0,
        mode = 777,
    }: {
        filepath: string;
        isDir: boolean;
        mtime?: number;
        size?: number;
        mode?: number;
    }) {
        this.name = path.posix.basename(filepath);
        this.path = filepath;
        this.isDir = isDir;
        this.mtime = mtime;
        this.size = size;
        this.mode = mode;
        this.entries = new Map();
    }
}

export class MCSFileSystemProvider implements vscode.FileSystemProvider {
    root = new Entry({
        isDir: true,
        filepath: "/",
    });

    private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
    readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> =
        this._emitter.event;

    _toEntries(items: MCSFileItem[]): Entry[] {
        return items.map(
            (e) =>
                new Entry({
                    filepath: e.path,
                    isDir: isDirectory(e),
                    mtime: fromMCSDatetime(e.time).getTime(),
                    size: e.size,
                    mode: e.mode,
                })
        );
    }

    /**
     * find前确保目录存在，不存在先获取
     */
    async _find({
        targetPath,
        silent = false,
    }: {
        targetPath: string;
        silent?: boolean;
    }): Promise<Entry | undefined> {
        if (this.root.entries.size === 0) {
            const data = await GlobalVar.mcsService.getAllFileList({
                target: "/",
            });
            for (const entry of this._toEntries(data.data!)) {
                this.root.entries.set(entry.name, entry);
            }
        }
        let target = this.root;
        let curPath = "/";
        for (const part of targetPath.split("/")) {
            if (!part) {
                continue;
            }
            curPath = path.posix.join(curPath, part);
            const t = target.entries.get(part);
            if (!t) {
                if (silent) {
                    return undefined;
                }
                throw vscode.FileSystemError.FileNotFound(
                    `can't find ${targetPath}`
                );
            }
            target = t!;
            if (target.isDir && target.entries.size === 0) {
                const data = await GlobalVar.mcsService.getAllFileList({
                    target: curPath,
                });
                for (const entry of this._toEntries(data.data!)) {
                    target.entries.set(entry.name, entry);
                }
            }
        }
        return target;
    }

    watch(
        uri: vscode.Uri,
        options: { recursive: boolean; excludes: string[] }
    ): vscode.Disposable {
        return new vscode.Disposable(() => {});
    }

    async stat(uri: vscode.Uri): Promise<vscode.FileStat> {
        let targetFile = (await this._find({ targetPath: uri.path }))!;
        return {
            type: targetFile.isDir
                ? vscode.FileType.Directory
                : vscode.FileType.File,
            ctime: Date.now(),
            mtime: targetFile.mtime,
            size: targetFile.size,
        };
    }
    async _setEntries(
        filepath: string,
        items: MCSFileItem[]
    ): Promise<[string, vscode.FileType][]> {
        const parent = await this._find({
            targetPath: path.posix.dirname(filepath),
        });
        for (const entry of this._toEntries(items)) {
            parent!.entries.set(entry.name, entry);
        }
        const result: [string, vscode.FileType][] = items.map((e) => [
            buildMCSUrl({
                path: e.path,
                pathOnly: true,
            }),
            isDirectory(e) ? vscode.FileType.Directory : vscode.FileType.File,
        ]);
        return result;
    }
    async readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
        const data = await GlobalVar.mcsService.getAllFileList({
            target: uri.path,
        });
        return await this._setEntries(uri.path, data.data!);
    }

    async createDirectory(uri: vscode.Uri): Promise<void> {
        const parent = await this._find({
            targetPath: path.posix.dirname(uri.path),
        });
        await GlobalVar.mcsService.mkFile({
            isDir: true,
            target: uri.path,
        });
        const entry = new Entry({
            isDir: true,
            filepath: uri.path,
        });
        parent!.entries.set(entry.name, entry);
        this._emitter.fire([
            {
                type: vscode.FileChangeType.Changed,
                uri,
            },
        ]);
    }

    async readFile(uri: vscode.Uri): Promise<Uint8Array> {
        const buffer = await GlobalVar.mcsService.downloadFile({
            filepath: uri.path,
        });
        return buffer ?? new TextEncoder().encode("");
    }

    async writeFile(
        uri: vscode.Uri,
        content: Uint8Array,
        options: { create: boolean; overwrite: boolean }
    ): Promise<void> {
        const basename = path.posix.basename(uri.path);
        const parent = await this._find({
            targetPath: path.posix.dirname(uri.path),
        })!;
        let entry = parent!.entries.get(basename);
        if (entry?.isDir) {
            throw vscode.FileSystemError.FileIsADirectory(uri);
        }
        if (!entry && !options.create) {
            throw vscode.FileSystemError.FileNotFound(uri);
        }
        if (entry && options.create && !options.overwrite) {
            throw vscode.FileSystemError.FileExists(uri);
        }
        if (content.length === 0) {
            await GlobalVar.mcsService.createFile(uri.path);
        } else {
            // 不知道为什么，使用Uint8Array在第二部总是报错No file found，明明有body
            await GlobalVar.mcsService.uploadFile({
                uploadDir: parent!.path,
                filepath: uri.path,
                content,
            });
        }
        let type = vscode.FileChangeType.Changed;
        if (!entry) {
            entry = new Entry({
                isDir: false,
                filepath: uri.path,
            });
            parent!.entries.set(basename, entry);
            type = vscode.FileChangeType.Created;
        } else {
            type = vscode.FileChangeType.Changed;
        }
        entry.mtime = Date.now();
        entry.size = content.byteLength;

        this._emitter.fire([
            {
                type: type,
                uri,
            },
        ]);
    }

    async delete(uri: vscode.Uri): Promise<void> {
        await GlobalVar.mcsService.deleteFiles([uri.path]);
        const basename = path.posix.basename(uri.path);
        const parent = await this._find({
            targetPath: path.posix.dirname(uri.path),
        })!;
        if (!parent!.entries.has(basename)) {
            throw vscode.FileSystemError.FileNotFound(uri);
        }
        parent!.entries.delete(basename);
        parent!.mtime = Date.now();
        this._emitter.fire([
            {
                type: vscode.FileChangeType.Deleted,
                uri,
            },
        ]);
    }

    async rename(oldUri: vscode.Uri, newUri: vscode.Uri): Promise<void> {
        const newName = path.posix.basename(newUri.path);
        await GlobalVar.mcsService.renameFile(oldUri.path, newName);

        const entry = await this._find({ targetPath: oldUri.path })!;
        const oldParent = await this._find({
            targetPath: path.posix.dirname(oldUri.path),
        })!;
        const newParent = await this._find({
            targetPath: path.posix.dirname(newUri.path),
        })!;
        oldParent!.entries.delete(entry!.name);
        entry!.name = newName;
        entry!.mtime = Date.now();
        newParent!.entries.set(newName, entry!);

        this._emitter.fire([
            {
                type: vscode.FileChangeType.Deleted,
                uri: oldUri,
            },
            {
                type: vscode.FileChangeType.Created,
                uri: newUri,
            },
        ]);
    }
}
