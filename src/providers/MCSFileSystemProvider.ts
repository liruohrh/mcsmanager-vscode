import * as vscode from "vscode";
import { GlobalVar } from "../utils/global";
import { logger } from "../utils/log";

export class MCSFileSystemProvider implements vscode.FileSystemProvider {
    private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
    readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this._emitter.event;

    watch(_uri: vscode.Uri, _options: { recursive: boolean; excludes: string[] }): vscode.Disposable {
        return new vscode.Disposable(() => {});
    }

    stat(_uri: vscode.Uri): vscode.FileStat {
        return {
            type: vscode.FileType.File,
            ctime: Date.now(),
            mtime: Date.now(),
            size: 0
        };
    }

    readDirectory(_uri: vscode.Uri): [string, vscode.FileType][] {
        return [];
    }

    createDirectory(_uri: vscode.Uri): void {
        throw vscode.FileSystemError.NoPermissions();
    }

    async readFile(uri: vscode.Uri): Promise<Uint8Array> {
        try {
            const params = new URLSearchParams(uri.query);
            const daemonId = params.get('daemonId');
            const uuid = params.get('uuid');

            if (!daemonId || !uuid) {
                throw new Error('Missing required parameters');
            }

            const content = await GlobalVar.mcsService.getFileContent(
                daemonId,
                uuid,
                uri.path
            );

            if (!content || typeof content !== 'string') {
                throw new Error('Failed to get file content');
            }

            return new TextEncoder().encode(content);
        } catch (error) {
            logger.error('Failed to read file:', error);
            throw vscode.FileSystemError.FileNotFound(uri);
        }
    }

    async writeFile(uri: vscode.Uri, content: Uint8Array, _options: { create: boolean; overwrite: boolean }): Promise<void> {
        try {
            const params = new URLSearchParams(uri.query);
            const daemonId = params.get('daemonId');
            const uuid = params.get('uuid');

            if (!daemonId || !uuid) {
                throw new Error('Missing required parameters');
            }

            const text = new TextDecoder().decode(content);
            const success = await GlobalVar.mcsService.updateFileContent(
                daemonId,
                uuid,
                uri.path,
                text
            );

            if (!success) {
                throw new Error('Failed to update file content');
            }

            this._emitter.fire([{
                type: vscode.FileChangeType.Changed,
                uri
            }]);
        } catch (error) {
            logger.error('Failed to write file:', error);
            throw vscode.FileSystemError.NoPermissions();
        }
    }

    delete(_uri: vscode.Uri): void {
        throw vscode.FileSystemError.NoPermissions();
    }

    rename(_oldUri: vscode.Uri, _newUri: vscode.Uri): void {
        throw vscode.FileSystemError.NoPermissions();
    }
}
