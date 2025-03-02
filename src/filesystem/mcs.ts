import * as vscode from "vscode";
import { GlobalVar } from "@/utils/global";
import { fromMCSDatetime, getItemType, isDirectory } from "@/utils/mcs";
import path from "path";
import { MCSFileItem } from "@/types";
import { logger } from "@/utils/log";

export class Entry implements Omit<MCSFileItem, "time"> {
    isDir: boolean;
    entries: Map<string, Entry>;
    mtime: number;
    content?: Uint8Array;
    name: string;
    path: string; // 文件的完整路径
    size: number;
    mode: number;
    type: number;
    constructor({
        filepath,
        isDir,
        mtime = 0,
        content,
        size = 0,
        mode = 777,
    }: Partial<Entry> & {
        filepath: string;
        isDir: boolean;
    }) {
        this.name = path.posix.basename(filepath);
        this.path = filepath;
        this.isDir = isDir;
        this.mtime = mtime;
        this.entries = new Map();
        this.content = content;
        this.size = size;
        this.mode = mode;
        this.type = getItemType(isDir);
    }

    get uri() {
        return MCSFileSystemProvider.uri({ path: this.path });
    }
    get uriStr() {
        return MCSFileSystemProvider.uriStr({ path: this.path });
    }

    /**
     * 不强制find，因为既然有Entry了，Root就一定有entries
     */
    get isRootFile() {
        return (
            !this.isDir &&
            GlobalVar.fileSystemProvider.root.entries.has(this.name)
        );
    }
    get isRootDir() {
        return (
            this.isDir &&
            GlobalVar.fileSystemProvider.root.entries.has(this.name)
        );
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

    static uriStr({ path }: { path: string }): string {
        if (!path.startsWith("/")) {
            path = "/" + path;
        }
        return `mcs://${path}`;
    }
    static get rootUri(): vscode.Uri {
        return vscode.Uri.parse(MCSFileSystemProvider.uriStr({ path: "/" }));
    }
    static uri({ path }: { path: string }): vscode.Uri {
        return vscode.Uri.parse(MCSFileSystemProvider.uriStr({ path }));
    }

    _sortEntries(dirEntry: Entry) {
        const dirs = Array.from(dirEntry.entries.values()).filter(
            (e) => e.isDir
        );
        const files = Array.from(dirEntry.entries.values()).filter(
            (e) => !e.isDir
        );
        dirs.sort((a, b) => a.name.localeCompare(b.name));
        files.sort((a, b) => a.name.localeCompare(b.name));
        dirEntry.entries = new Map();
        for (const entry of [...dirs, ...files]) {
            dirEntry.entries.set(entry.name, entry);
        }
    }
    _toEntries(items: MCSFileItem[]): Entry[] {
        return items.map(
            (e) =>
                new Entry({
                    filepath: e.path,
                    isDir: isDirectory(e),
                    mtime: fromMCSDatetime(e.time).getTime(),
                    size: e.size,
                    mode: e.mode,
                    type: e.type,
                })
        );
    }

    /**
     * find前确保目录存在，不存在先获取
     */
    async findEntry({
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
            this._sortEntries(this.root);
        }
        if (targetPath === "/") {
            return this.root;
        }
        let target = this.root;
        let curPath = "/";
        for (const part of targetPath.split("/")) {
            if (!part) {
                continue;
            }
            curPath = path.posix.join(curPath, part);
            const entry = target.entries.get(part);
            if (!entry) {
                if (silent) {
                    return undefined;
                }
                throw vscode.FileSystemError.FileNotFound(
                    `can't find ${targetPath}`
                );
            }
            target = entry!;
            if (target.isDir && target.entries.size === 0) {
                const data = await GlobalVar.mcsService.getAllFileList({
                    target: curPath,
                });
                for (const entry of this._toEntries(data.data!)) {
                    target.entries.set(entry.name, entry);
                }
                this._sortEntries(target);
            }
            if (target.path === targetPath) {
                return target;
            }
        }
    }
    async findEntryMust(targetPath: string): Promise<Entry> {
        return (await this.findEntry({ targetPath, silent: false }))!;
    }
    async has(targetPath: string): Promise<boolean> {
        return (
            (await this.findEntry({ targetPath, silent: true })) !== undefined
        );
    }
    async findParent({
        targetPath,
        silent = false,
    }: {
        targetPath: string;
        silent?: boolean;
    }): Promise<Entry | undefined> {
        return this.findEntry({
            targetPath: path.posix.dirname(targetPath),
        })!;
    }
    async findParentMust(targetPath: string): Promise<Entry> {
        return (await this.findParent({ targetPath, silent: false }))!;
    }

    async refresh(filepath: string, reopen: boolean = true) {
        let entry = await this.findEntryMust(filepath);
        if (!entry.isDir) {
            entry.content = new TextEncoder().encode(
                await GlobalVar.mcsService.getFileContent(entry.path)
            );
            if (reopen) {
                const refreshFileTab =
                    vscode.window.tabGroups.activeTabGroup.tabs.find((e) => {
                        if (e.input instanceof vscode.TabInputText) {
                            return e.input.uri.path === filepath;
                        }
                        return false;
                    });
                if (refreshFileTab) {
                    const result = await vscode.window.showInformationMessage(
                        `reopen ${filepath}?`,
                        "Yes",
                        "No"
                    );
                    if (result !== "Yes") {
                        return;
                    }
                    await vscode.window.tabGroups.close(refreshFileTab);
                    vscode.commands.executeCommand(
                        "vscode.open",
                        MCSFileSystemProvider.uri({ path: filepath }),
                        {
                            viewColumn: vscode.ViewColumn.Active,
                            preview: false,
                        }
                    );
                }
            }
        } else {
            this.refreshDir(entry);
            if (reopen) {
                const refreshFileTabs = vscode.window.tabGroups.all
                    .map((g) =>
                        g.tabs.filter((e) => {
                            if (e.input instanceof vscode.TabInputText) {
                                return e.input.uri.path.startsWith(filepath);
                            }
                            return false;
                        })
                    )
                    .flatMap((e) => e);
                if (refreshFileTabs && refreshFileTabs.length !== 0) {
                    await vscode.window.tabGroups.close(refreshFileTabs);
                    const filepaths = refreshFileTabs.map(
                        (e) => (e.input as vscode.TabInputText).uri.path
                    );
                    const reopenFilepaths = await vscode.window.showQuickPick(
                        filepaths,
                        {
                            placeHolder: "select files to reopen",
                            canPickMany: true,
                        }
                    );
                    if (reopenFilepaths && reopenFilepaths.length !== 0) {
                        for (const reopenFilepath of reopenFilepaths) {
                            await vscode.commands.executeCommand(
                                "vscode.open",
                                MCSFileSystemProvider.uri({
                                    path: reopenFilepath,
                                }),
                                {
                                    viewColumn: vscode.ViewColumn.Active,
                                    preview: false,
                                }
                            );
                        }
                    }
                }
            }
        }
        this._emitter.fire([
            {
                type: vscode.FileChangeType.Changed,
                uri: MCSFileSystemProvider.uri({ path: filepath }),
            },
        ]);
    }

    /**
     *
     * @param dirEntry 仅更新dir的entries
     */
    async refreshDir(dirEntry: Entry): Promise<void> {
        if (!dirEntry.isDir) {
            throw vscode.FileSystemError.FileNotADirectory(dirEntry.uri);
        }
        const resp = await GlobalVar.mcsService.getAllFileList({
            target: dirEntry.path,
        });
        dirEntry!.entries.clear();
        for (const entry0 of this._toEntries(resp.data!)) {
            dirEntry!.entries.set(entry0.name, entry0);
        }
    }

    watch(
        uri: vscode.Uri,
        options: { recursive: boolean; excludes: string[] }
    ): vscode.Disposable {
        return new vscode.Disposable(() => {});
    }

    async stat(uri: vscode.Uri): Promise<vscode.FileStat> {
        let targetFile = await this.findEntryMust(uri.path);
        return {
            type: targetFile.isDir
                ? vscode.FileType.Directory
                : vscode.FileType.File,
            ctime: Date.now(),
            mtime: targetFile.mtime,
            size: targetFile.size,
        };
    }
    async readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
        const data = await this.readDir(uri);
        const result: [string, vscode.FileType][] = data.map((e) => [
            e.uri.toString(),
            e.isDir ? vscode.FileType.Directory : vscode.FileType.File,
        ]);
        return result;
    }
    async readDir(uri: vscode.Uri): Promise<Entry[]> {
        const dirEntry = await this.findEntryMust(uri.path);
        return Array.from(dirEntry.entries.values());
    }

    async createDirectory(uri: vscode.Uri): Promise<void> {
        await this.create(uri.path, true);
    }

    async create(filepath: string, isDir: boolean): Promise<void> {
        const parent = await this.findEntryMust(path.posix.dirname(filepath));
        await GlobalVar.mcsService.mkFile({
            isDir: isDir,
            target: filepath,
        });
        const now = Date.now();
        const entry = new Entry({
            isDir: isDir,
            filepath: filepath,
            mtime: now,
            content: new TextEncoder().encode(""),
        });
        parent.mtime = now;
        parent.entries.set(entry.name, entry);
        this._sortEntries(parent!);
        this._emitter.fire([
            {
                type: vscode.FileChangeType.Created,
                uri: MCSFileSystemProvider.uri({ path: filepath }),
            },
        ]);
        GlobalVar.fileTreeDataProvider.refresh();
    }

    async readFile(uri: vscode.Uri): Promise<Uint8Array> {
        const target = await this.findEntryMust(uri.path);
        if (target.content) {
            return target.content;
        }
        const buffer = await GlobalVar.mcsService.downloadFile({
            filepath: uri.path,
        });
        target.content = buffer!;
        return target.content;
    }

    async writeFile(
        uri: vscode.Uri,
        content: Uint8Array,
        options: { create: boolean; overwrite: boolean }
    ): Promise<void> {
        if (content.length === 0 && (await this.has(uri.path))) {
            await this.create(uri.path, false);
            return;
        }
        await this.write(uri, content, options);
    }
    async write(
        uri: vscode.Uri,
        content: Uint8Array,
        options?: { create: boolean; overwrite: boolean }
    ) {
        const basename = path.posix.basename(uri.path);
        const parent = await this.findEntryMust(path.posix.dirname(uri.path));
        //基本都存在，且是文件
        let entry = parent.entries.get(basename);
        //基本都是create=true, overwrite=true
        if (options) {
            if (!entry && !options.create) {
                throw logger.terror({
                    message: "file is not exists, but create is false",
                    errorGetter: vscode.FileSystemError.FileNotFound,
                });
            }
            if (entry && options.create && !options.overwrite) {
                throw logger.terror({
                    message: "file already exists, but overwrite is false",
                    errorGetter: vscode.FileSystemError.FileExists,
                });
            }
        }
        // 文件内容为空报错："No file found"。因此文件内容为空就更新文件而不要上传。
        if (content.length === 0) {
            await GlobalVar.mcsService.updateFileContent(uri.path, "");
        } else {
            await GlobalVar.mcsService.uploadFile({
                uploadDir: parent.path,
                filepath: uri.path,
                content,
            });
        }
        this._emitter.fire([
            {
                type: entry
                    ? vscode.FileChangeType.Changed
                    : vscode.FileChangeType.Created,
                uri,
            },
        ]);
        //不管是更新为空文件、创建新文件、更新文件内容，都这样处理
        await this.refreshDir(parent);
        GlobalVar.fileTreeDataProvider.refresh(parent);
    }

    /**
     * 批量删除文件会一个一个执行，非常不好，不推荐在工作区批量删除文件
     */
    async delete(uri: vscode.Uri): Promise<void> {
        await this.deleteFiles(uri.path);
    }
    async deleteFiles(paths: string | Entry[]): Promise<void> {
        //删除了目录，目录里的就不需要删除了
        let paths0: string[] = [];
        if (typeof paths === "string") {
            paths0 = [paths];
        } else {
            const _paths = paths as Entry[];
            paths0 = _paths
                .filter(
                    (p) =>
                        !_paths.some(
                            (p0) =>
                                p0.path !== p.path &&
                                p.path.startsWith(p0.path) &&
                                p0.isDir
                        )
                )
                .map((e) => e.path);
        }
        await GlobalVar.mcsService.deleteFiles(paths0);
        const changes = [];
        const now = Date.now();
        for (const path0 of paths0) {
            const basename = path.posix.basename(path0);
            const parent = await this.findEntryMust(path.posix.dirname(path0));
            parent.entries.delete(basename);
            parent.mtime = now;
            changes.push({
                type: vscode.FileChangeType.Deleted,
                uri: MCSFileSystemProvider.uri({ path: path0 }),
            });
        }
        // 由于2个VIew都可以操作，因此都需要fire
        // 因为fire多次最终也只是一次，因此直接fire
        this._emitter.fire(changes);
        GlobalVar.fileTreeDataProvider.refresh();
    }

    /**
     * 批量移动文件会一个一个执行，非常不好，不推荐在工作区批量移动文件
     */
    async rename(oldUri: vscode.Uri, newUri: vscode.Uri): Promise<void> {
        const oldName = path.posix.basename(oldUri.path);
        const oldParent = await this.findEntryMust(
            path.posix.dirname(oldUri.path)
        );
        const newName = path.posix.basename(newUri.path);
        const newParent = await this.findEntryMust(
            path.posix.dirname(newUri.path)
        );

        await GlobalVar.mcsService.moveFile(oldUri.path, newUri.path);

        const now = Date.now();
        const oldEntry = oldParent.entries.get(oldName)!;
        oldParent.entries.delete(oldName);
        oldParent.mtime = now;

        oldEntry.name = newName;
        oldEntry.path = newUri.path;
        oldEntry.mtime = now;
        newParent.entries.set(newName, oldEntry);
        newParent.mtime = now;
        this._sortEntries(newParent);

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
        GlobalVar.fileTreeDataProvider.refresh();
    }

    async move({
        targets,
        dist: distEntry,
        toDistDir = false,
    }: {
        targets: Entry[];
        dist: Entry;
        toDistDir?: boolean;
    }): Promise<void> {
        let dist = distEntry;
        if (toDistDir) {
            dist = await this.findParentMust(dist.path);
        }
        //移动了目录，目录里的就不需要移动了
        const targetPaths = targets
            .filter(
                (p) =>
                    //不要目录一样的
                    p.path !== dist.path &&
                    //已经在该新目录了
                    path.posix.dirname(p.path) !== dist.path &&
                    //p的目录必须不在oldPaths中，且p0必须是文件（可能无扩展名或者扩展名有部分前缀一样）
                    !targets.some(
                        (p0) =>
                            p0.path !== p.path &&
                            p.path.startsWith(p0.path) &&
                            //允许2个文件前缀相等
                            p0.isDir
                    )
            )
            .map((e) => e.path);
        if (targetPaths.length === 0) {
            vscode.window.showWarningMessage(
                `has not files in [${targets.map(
                    (e) => e.path
                )}] need to move to ${dist.path}`
            );
            return;
        }

        const oldParentMap = new Map<string, Entry>();
        for (const oldPath of targetPaths) {
            const oldParent = await this.findEntryMust(
                path.posix.dirname(oldPath)
            );
            oldParentMap.set(oldPath, oldParent);
        }
        const newParent = await this.findEntryMust(dist.path);

        await GlobalVar.mcsService.moveFiles(targetPaths, dist.path);

        const now = Date.now();
        //删除旧目录中的，添加到新目录中
        newParent.mtime = now;
        const newPaths: string[] = [];
        for (const [oldPath, oldParent] of oldParentMap) {
            const filename = path.posix.basename(oldPath);
            newPaths.push(path.posix.join(dist.path, filename));
            const oldEntry = oldParent.entries.get(filename)!;
            oldParent.entries.delete(oldEntry.name);
            oldParent.mtime = now;

            oldEntry.mtime = now;
            oldEntry.path = path.posix.join(newParent.path, filename);
            newParent.entries.set(filename, oldEntry);
        }
        this._sortEntries(newParent);

        this._emitter.fire([
            ...targetPaths.map((p) => ({
                type: vscode.FileChangeType.Deleted,
                uri: MCSFileSystemProvider.uri({ path: p }),
            })),
            ...newPaths.map((p) => ({
                type: vscode.FileChangeType.Created,
                uri: MCSFileSystemProvider.uri({ path: p }),
            })),
        ]);
        if (targetPaths.length === 1) {
            const targetParent = await this.findParentMust(targetPaths[0]);
            GlobalVar.fileTreeDataProvider.refresh(targetParent);
            GlobalVar.fileTreeDataProvider.refresh(dist);
        } else {
            GlobalVar.fileTreeDataProvider.refresh();
        }
    }
    async copy(
        source: vscode.Uri,
        destination: vscode.Uri,
        options: { readonly overwrite: boolean }
    ): Promise<void> {
        const target = await this.findEntryMust(source.path);
        const dist = await this.findEntryMust(destination.path);
        if (
            !options.overwrite &&
            dist.entries.has(path.posix.basename(source.path))
        ) {
            throw vscode.FileSystemError.FileExists(destination);
        }

        await this.copyFiles({
            targets: [target],
            dist: dist,
        });
    }
    async copyFiles({
        targets,
        dist,
    }: {
        targets: Entry[];
        dist: Entry;
    }): Promise<void> {
        if (targets.length === 0) {
            vscode.window.showWarningMessage(
                `has not files in [${targets.map(
                    (e) => e.path
                )}] need to copy to ${dist.path}`
            );
            return;
        }
        if (!dist?.isDir) {
            throw vscode.FileSystemError.FileNotADirectory(dist.uri);
        }
        await GlobalVar.mcsService.copyFiles(
            targets.map((e) => e.path),
            dist.path
        );
        const now = Date.now();
        dist!.mtime = now;
        this.refreshDir(dist);
        GlobalVar.fileTreeDataProvider.refresh(dist);
        this._emitter.fire([
            {
                type: vscode.FileChangeType.Created,
                uri: dist.uri,
            },
        ]);
    }
}
