import * as vscode from "vscode";
import fs from "fs";
import { GlobalVar } from "@/utils/global";
import path from "path";
import { isCompressedFile } from "@/utils/file";
import { Entry, MCSFileSystemProvider } from "@/filesystem/mcs";

export async function openAsWSCommand() {
    if (!GlobalVar.currentInstance) {
        vscode.window.showErrorMessage("has not select instance");
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
    if (GlobalVar.mcsFileExplorer.selection.length === 0) {
        vscode.window.showWarningMessage(
            "has not select dir in File Explorer view to upload"
        );
        return;
    }
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
        vscode.window.showInformationMessage(
            `Cancel to upload file in editor, no upload dir selected`
        );
        return;
    }
    await GlobalVar.fileSystemProvider.write(
        MCSFileSystemProvider.uri({
            path: path.posix.join(result, path.posix.basename(uri.fsPath)),
        }),
        await vscode.workspace.fs.readFile(uri)
    );
    vscode.window.showInformationMessage(
        `Success to upload ${uri.fsPath} to ${result}`
    );
}

export async function pasteFilesCommand() {
    const selection = GlobalVar.mcsFileExplorer.selection;
    if (selection.length !== 1) {
        return;
    }
    let dist = selection[0];
    if (dist.isRootFile) {
        dist = GlobalVar.fileSystemProvider.root;
    }
    if (!dist.isDir) {
        throw vscode.FileSystemError.FileNotADirectory(
            "only support upload file to dir, not " + dist.path
        );
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
                dist,
            });
        } else if (copyEntries.length !== 0) {
            await GlobalVar.fileSystemProvider.copyFiles({
                targets: copyEntries,
                dist,
            });
        } else {
            if (GlobalVar.mcsFileExplorer.visible) {
                vscode.window.showWarningMessage(
                    "has not copy or cut files to paste"
                );
            }
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
        if (GlobalVar.mcsFileExplorer.visible) {
            vscode.window.showWarningMessage("has not select file to copy");
        }
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
        if (GlobalVar.mcsFileExplorer.visible) {
            vscode.window.showWarningMessage("has not select file to copy");
        }
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

export async function uploadFileCommand(element: Entry) {
    let el = element;
    if (el.isRootFile) {
        el = GlobalVar.fileSystemProvider.root;
    }
    if (!el.isDir) {
        throw vscode.FileSystemError.FileNotADirectory(
            "only support upload file to dir, not " + el.path
        );
    }
    const uploadDir = el.path;
    const fileUri = await vscode.window.showOpenDialog({
        title: `update file to ${uploadDir}`,
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        filters: {
            "All Files": ["*"],
        },
    });
    if (!fileUri || fileUri.length === 0) {
        vscode.window.showInformationMessage(
            `Cancel to upload, no file selected`
        );
        return;
    }
    const filepath = fileUri[0].fsPath;
    //path自动转为posix，fsPath不会
    const filename = path.posix.basename(fileUri[0].path);
    await GlobalVar.fileSystemProvider.write(
        MCSFileSystemProvider.uri({
            path: path.posix.join(uploadDir, filename),
        }),
        fs.readFileSync(filepath)
    );
    vscode.window.showInformationMessage(
        `Success to upload ${filepath} to ${uploadDir}`
    );
}

export async function downloadFileCommand(element: Entry) {
    if (element.isDir) {
        vscode.window.showErrorMessage(
            `only support download file, not ${element.path}`
        );
        return;
    }
    const distUri = await vscode.window.showSaveDialog({
        title: `download ${element.path}`,
        defaultUri: vscode.Uri.file(element.path),
        filters: {
            "All Files": ["*"],
        },
    });
    if (!distUri) {
        vscode.window.showInformationMessage(
            `Cancel to download, no dist path selected`
        );
        return;
    }
    const content = await GlobalVar.fileSystemProvider.readFile(element.uri);
    await fs.writeFileSync(distUri.fsPath, content);
    vscode.window.showInformationMessage(
        `Success to download ${element.path} to ${distUri.fsPath}`
    );
}

export async function renameFileCommand(element: Entry) {
    const newName = await vscode.window.showInputBox({
        title: "new name",
        value: element.name,
        valueSelection: [0, element.name.lastIndexOf(".")],
        prompt: `rename ${element.path}`,
    });
    if (!newName) {
        vscode.window.showInformationMessage(
            `Cancel to rename, has not input new name`
        );
        return;
    }
    await GlobalVar.fileSystemProvider.rename(
        element.uri,
        MCSFileSystemProvider.uri({
            path: path.posix.join(path.posix.dirname(element.path), newName),
        })
    );
    vscode.window.showInformationMessage("Rename File Success");
}

export async function createFileCommand({
    isDir = false,
    element,
}: {
    isDir?: boolean;
    element: Entry;
}) {
    let el = element;
    if (el.isRootFile) {
        el = GlobalVar.fileSystemProvider.root;
    }
    if (!el.isDir) {
        throw vscode.FileSystemError.FileNotADirectory(
            `only support create file in dir, not ${el.path}`
        );
    }
    const entryType = isDir ? "dir" : "file";
    const name = await vscode.window.showInputBox({
        placeHolder: `please input ${entryType} name`,
        prompt: `only support input name, not path, create in ${el.path}`,
    });
    if (!name) {
        vscode.window.showInformationMessage(
            `Cancel to create, has not input ${entryType} name`
        );
        return;
    }
    const filepath = path.posix.join(el.path, name);
    await GlobalVar.fileSystemProvider.create(filepath, isDir);
    vscode.window.showInformationMessage(
        `Success to create ${entryType} ${name} in ${filepath}`
    );
}
export async function deleteFileCommand(element: Entry) {
    _deleteFilesCommand([element]);
}
export async function deleteFilesCommand(elements: Entry[]) {
    _deleteFilesCommand(elements);
}
export async function _deleteFilesCommand(elements: Entry[]) {
    //删除操作非常危险，需要二次确认
    const result = await vscode.window.showQuickPick(
        elements.map((e) => e.path),
        {
            title: `please select entries to delete`,
            canPickMany: true,
        }
    );
    if (!result || result.length === 0) {
        vscode.window.showInformationMessage(
            "Cancel to delete, no entry selected"
        );
        return;
    }

    const targets = elements.filter((e) => result.includes(e.path));
    await GlobalVar.fileSystemProvider.deleteFiles(targets);
    vscode.window.showInformationMessage(
        `Success to delete ${targets.length} files`
    );
}
export function refreshRootFileCommand() {
    if (!GlobalVar.currentInstance) {
        vscode.window.showErrorMessage("has not select instance");
        return;
    }
    GlobalVar.fileSystemProvider.refresh("/");
    //仅文件列表View支持根刷新，因此需要刷新
    GlobalVar.fileTreeDataProvider.refresh();
    vscode.window.showInformationMessage(`Success to refresh /`);
}

export async function refreshFileCommand(
    //todo 虚拟工作区怎么刷新来着？？？
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
        //uri是工作区刷新，就不刷新文件列表View了
        GlobalVar.fileTreeDataProvider.refresh(element);
    }
    vscode.window.showInformationMessage(`Success to refresh ${filepath}`);
}

export async function openFileCommand(element: Entry) {
    //点击2次才算打开，这样可以不会影响其他操作。
    // 如快捷键，如果是点击就打开，F2重命名文件就很难，Ctrl+X剪切也很难
    GlobalVar.clickedFileEntryCount++;
    if (GlobalVar.clickedFileEntryCount < 2) {
        setTimeout(() => {
            GlobalVar.clickedFileEntryCount = 0;
        }, 300);
        return;
    }
    GlobalVar.clickedFileEntryCount = 0;
    if (isCompressedFile(element.name)) {
        const result = await vscode.window.showWarningMessage(
            `${element.name} is compress file. Do you want to download?`,
            "Yes",
            "No"
        );
        if (result !== "Yes") {
            vscode.window.showInformationMessage("Cancel to download");
            return;
        }
        await downloadFileCommand(element);
        return;
    }
    // 创建mcs scheme的URI
    const uri = element.uri;
    //vscode.TextDocumentShowOptions
    vscode.commands.executeCommand("vscode.open", uri, {
        viewColumn: vscode.ViewColumn.Active,
        preview: false,
    });
}
