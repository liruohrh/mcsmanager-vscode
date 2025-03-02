import * as vscode from "vscode";
import fs from "fs";
import { MCSInstance } from "@/types";
import { GlobalVar } from "@/utils/global";
import path from "path";
import { isCompressedFile } from "@/utils/file";
import { Entry, MCSFileSystemProvider } from "@/filesystem/mcs";

export const COMMAND_OPEN_AS_WS = "mcsManager.openAsWS";
export const COMMAND_UPLOAD_EDITOR_DOCUMENTS =
    "mcsManager.uploadEditorDocuments";
export const COMMAND_RENAME_FILE = "mcsManager.renameFile";
export const COMMAND_UPLOAD_FILE = "mcsManager.uploadFile";
export const COMMAND_DOWNLOAD_FILE = "mcsManager.downloadFile";
export const COMMAND_CREATE_DIR = "mcsManager.createDir";
export const COMMAND_CREATE_FILE = "mcsManager.createFile";
export const COMMAND_DELETE_FILES = "mcsManager.deleteFiles";
export const COMMAND_REFRESH_FILE_ROOT = "mcsManager.refreshFileRoot";
export const COMMAND_REFRESH_FILES = "mcsManager.refreshFiles";
export const COMMAND_OPEN_FILE = "mcsManager.openFile";

export async function pasteFilesCommand() {
    const selection = GlobalVar.mcsFileExplorer.selection;
    if (selection.length !== 1) {
        return;
    }
    const cutEntries = GlobalVar.fileTreeDataProvider.cutEntries;
    const copyEntries = GlobalVar.fileTreeDataProvider.copyEntries;
    try {
        if (
            cutEntries.length !== 0 &&
            !(
                cutEntries.length === 1 &&
                cutEntries[0].path === selection[0].path
            )
        ) {
            await GlobalVar.fileSystemProvider.move({
                targets: cutEntries,
                dist: selection[0],
            });
        } else if (copyEntries.length !== 0) {
            await GlobalVar.fileSystemProvider.copyFiles({
                targets: copyEntries,
                dist: selection[0],
            });
        }
    } finally {
        GlobalVar.fileTreeDataProvider.cutEntries = [];
        GlobalVar.fileTreeDataProvider.copyEntries = [];
        vscode.commands.executeCommand(
            "setContext",
            "mcsManager.hasCopyOrCutFile",
            false
        );
    }
}
export async function cutFilesCommand() {
    if (GlobalVar.mcsFileExplorer.selection.length === 0) {
        return;
    }
    GlobalVar.fileTreeDataProvider.cutEntries = [
        ...GlobalVar.mcsFileExplorer.selection,
    ];
    GlobalVar.fileTreeDataProvider.copyEntries = [];
    vscode.commands.executeCommand(
        "setContext",
        "mcsManager.hasCopyOrCutFile",
        true
    );
}
export async function copyFilesCommand() {
    if (GlobalVar.mcsFileExplorer.selection.length === 0) {
        return;
    }
    GlobalVar.fileTreeDataProvider.copyEntries = [
        ...GlobalVar.mcsFileExplorer.selection,
    ];
    GlobalVar.fileTreeDataProvider.cutEntries = [];
    vscode.commands.executeCommand(
        "setContext",
        "mcsManager.hasCopyOrCutFile",
        true
    );
}

export async function openAsWSCommand() {
    if (!GlobalVar.currentInstance) {
        return;
    }
    vscode.commands.executeCommand(
        "vscode.openFolder",
        MCSFileSystemProvider.rootUri,
        {
            forceNewWindow: false,
            profile: "default",
        }
    );
}

/**
 * 指定目录（可以事先选中）
 */
export async function uploadEditorDocumentsCommand(uri: vscode.Uri) {
    if (!GlobalVar.currentInstance) {
        vscode.window.showErrorMessage("has not select instance");
        return;
    }
    const filepath = uri.fsPath;
    const result = await vscode.window.showQuickPick(
        [
            "/",
            ...GlobalVar.mcsFileExplorer.selection
                .filter((e) => e.isDir)
                .map((e) => e.path),
        ],
        {
            title: "select a dir to upload",
        }
    );
    if (!result) {
        return;
    }
    await GlobalVar.fileSystemProvider.write(
        MCSFileSystemProvider.uri({
            path: path.posix.join(result, path.posix.basename(filepath)),
        }),
        await vscode.workspace.fs.readFile(vscode.Uri.file(filepath))
    );
    vscode.window.showInformationMessage(
        `successfully upload ${filepath} to ${result}`
    );
}

export async function renameFileCommand(element?: Entry) {
    if (!element) {
        if (GlobalVar.mcsFileExplorer.selection.length === 1) {
            element = GlobalVar.mcsFileExplorer.selection[0];
        }
        if (!element) {
            throw Error("no selected file");
        }
    }
    const newName = await vscode.window.showInputBox({
        title: "new name",
        value: element.name,
        valueSelection: [0, element.name.lastIndexOf(".")],
        prompt: `rename ${element.path}`,
    });
    if (!newName) {
        return;
    }
    await GlobalVar.fileSystemProvider.rename(
        element.uri,
        MCSFileSystemProvider.uri({
            path: path.posix.join(path.posix.dirname(element.path), newName),
        })
    );
    vscode.window.showInformationMessage("Rename File success");
}

export async function uploadFileCommand(element: Entry) {
    if (!element.isRootFile && !element.isDir) {
        vscode.window.showErrorMessage(
            `${element.path} 不是根目录文件或者目录, 无法上传`
        );
        return;
    }
    const fileUri = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        filters: {
            "All Files": ["*"],
        },
    });
    if (!fileUri || fileUri.length === 0) {
        return;
    }
    const filepath = fileUri[0].fsPath;
    const uploadDir = element.isRootFile ? "/" : element.path;
    await GlobalVar.fileSystemProvider.write(
        MCSFileSystemProvider.uri({
            path: path.posix.join(uploadDir, path.posix.basename(filepath)),
        }),
        fs.readFileSync(filepath)
    );
    vscode.window.showInformationMessage(
        `成功上传文件 ${filepath} 到 ${uploadDir}`
    );
}

export async function downloadFileCommand(element: Entry) {
    if (element.isDir) {
        vscode.window.showErrorMessage(`暂时只支持下载文件`);
        return;
    }
    const distUri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(element.path),
        filters: {
            "All Files": ["*"],
        },
    });
    if (!distUri) {
        return;
    }
    const distpath = distUri.fsPath;
    const content = await GlobalVar.fileSystemProvider.readFile(element.uri);
    await fs.writeFileSync(distUri.fsPath, content);
    vscode.window.showInformationMessage(
        `成功下载文件 ${element.path} 到 ${distpath}`
    );
}

export async function createFileCommand({
    isDir = false,
    element,
}: {
    isDir?: boolean;
    element: Entry;
}) {
    const text = isDir ? "目录" : "文件";
    if (!element.isRootFile && !element.isDir) {
        vscode.window.showErrorMessage(
            `只能在根目录文件 或者 文件夹下创建${text}, 非法路径 ${element.path}`
        );
        return;
    }
    const name = await vscode.window.showInputBox({
        placeHolder: `请输入${text}路径（会自动添加${
            element.isRootFile ? "/" : element.path
        }）`,
    });
    if (!name) {
        return;
    }
    const filepath = !element.isRootFile
        ? path.posix.join(element.path, name)
        : name.startsWith("/")
        ? name
        : `/${name}`;
    await GlobalVar.fileSystemProvider.create(filepath, isDir);
    vscode.window.showInformationMessage(`创建${text} ${filepath} 成功`);
}

export async function deleteFilesCommand() {
    const els = [...GlobalVar.mcsFileExplorer!.selection];
    if (els.length === 0) {
        await vscode.window.showWarningMessage("要删除文件，请先选中文件");
        return;
    }
    //删除操作非常危险，需要二次确认
    const result = await vscode.window.showWarningMessage(
        `是否要删除删除${els.length}个文件, [${els
            .map((e) => e.path)
            .join(",")}]`,
        "Yes",
        "No"
    );

    if (result !== "Yes") {
        return;
    }
    await GlobalVar.fileSystemProvider.deleteFiles(els);
    vscode.window.showInformationMessage(`成功删除文件${els.length} 个文件`);
    GlobalVar.outputChannel.info(
        `成功删除文件 ${els.length} 个文件, \n\t${els
            .map((e) => e.path)
            .join("\n\t")}`
    );
}
export function refreshFileRootCommand() {
    GlobalVar.fileSystemProvider.refresh("/");
    GlobalVar.outputChannel.info(`Success to refresh /`);
}

export async function refreshFilesCommand(
    element: Entry | vscode.Uri
): Promise<void> {
    let filepath = "";
    if (element instanceof vscode.Uri) {
        filepath = element.path;
    } else {
        filepath = element.path;
    }
    await GlobalVar.fileSystemProvider.refresh(filepath);
    if (!(element instanceof vscode.Uri)) {
        GlobalVar.fileTreeDataProvider.refresh(element);
    }
    GlobalVar.outputChannel.info(`Success to refresh ${filepath}`);
}

export async function openFileCommand(fileItem: Entry) {
    if (isCompressedFile(fileItem.name)) {
        const result = await vscode.window.showWarningMessage(
            `${fileItem.name} is compress file. Do you want to download?`,
            "Yes",
            "No"
        );
        if (result !== "Yes") {
            return;
        }
        await downloadFileCommand(fileItem);
    }
    // 创建mcs scheme的URI
    const uri = fileItem.uri;
    //vscode.TextDocumentShowOptions
    vscode.commands.executeCommand("vscode.open", uri, {
        viewColumn: vscode.ViewColumn.Active,
        preview: false,
    });
}
