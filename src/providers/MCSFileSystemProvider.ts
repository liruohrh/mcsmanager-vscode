import * as vscode from "vscode";
import { GlobalVar } from "../utils/global";

export class MCSFileSystemProvider implements vscode.FileSystemProvider {
    private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
    readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> =
        this._emitter.event;

    watch(
        _uri: vscode.Uri,
        _options: { recursive: boolean; excludes: string[] }
    ): vscode.Disposable {
        return new vscode.Disposable(() => {});
    }

    stat(_uri: vscode.Uri): vscode.FileStat {
        return {
            type: vscode.FileType.File,
            ctime: Date.now(),
            mtime: Date.now(),
            size: 0,
        };
    }

    readDirectory(_uri: vscode.Uri): [string, vscode.FileType][] {
        return [];
    }

    createDirectory(_uri: vscode.Uri): void {
        throw vscode.FileSystemError.NoPermissions();
    }

    async readFile(uri: vscode.Uri): Promise<Uint8Array> {
        const params = new URLSearchParams(uri.query);
        const daemonId = params.get("daemonId");
        const uuid = params.get("uuid");

        if (!daemonId || !uuid) {
            throw Error("require daemonId or uuid");
        }

        const content = await GlobalVar.mcsService.getFileContent(
            daemonId,
            uuid,
            uri.path
        );

        if (!content || typeof content !== "string") {
            throw Error(`Failed to get file content: ${uri.path}`);
        }

        return new TextEncoder().encode(content);
    }

    async writeFile(
        uri: vscode.Uri,
        content: Uint8Array,
        _options: { create: boolean; overwrite: boolean }
    ): Promise<void> {
        const params = new URLSearchParams(uri.query);
        const daemonId = params.get("daemonId");
        const uuid = params.get("uuid");

        if (!daemonId || !uuid) {
            throw Error("require daemonId or uuid");
        }

        const text = new TextDecoder().decode(content);
        const success = await GlobalVar.mcsService.updateFileContent(
            daemonId,
            uuid,
            uri.path,
            text
        );

        if (!success) {
            throw Error(`Failed to update file content: ${uri.path}`);
        }

        this._emitter.fire([
            {
                type: vscode.FileChangeType.Changed,
                uri,
            },
        ]);
    }

    delete(_uri: vscode.Uri): void {
        throw vscode.FileSystemError.NoPermissions();
    }

    rename(_oldUri: vscode.Uri, _newUri: vscode.Uri): void {
        throw vscode.FileSystemError.NoPermissions();
    }
}
