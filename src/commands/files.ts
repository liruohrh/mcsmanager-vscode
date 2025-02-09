import * as vscode from "vscode";
import { MCSFileItem, MCSInstance } from "@/types";
import { buildMCSUrl, isDirectory, isTextFile } from "@/utils/mcs";
import { GlobalVar } from "@/utils/global";
import path from "path";
export const COMMAND_UPLOAD_EDITOR_DOCUMENTS =
    "mcsManager.uploadEditorDocuments";
export const COMMAND_RENAME_FILE = "mcsManager.renameFile";
export const COMMAND_UPLOAD_FILE_TO_ROOT = "mcsManager.uploadFileToRoot";
export const COMMAND_UPLOAD_FILE = "mcsManager.uploadFile";
export const COMMAND_DOWNLOAD_FILE = "mcsManager.downloadFile";
export const COMMAND_CREATE_DIR_IN_ROOT = "mcsManager.createDirInRoot";
export const COMMAND_CREATE_DIR = "mcsManager.createDir";
export const COMMAND_CREATE_FILE_IN_ROOT = "mcsManager.createFileInRoot";
export const COMMAND_CREATE_FILE = "mcsManager.createFile";
export const COMMAND_BATCH_DELETE_FILES = "mcsManager.batchDeleteFiles";
export const COMMAND_DELETE_FILES = "mcsManager.deleteFiles";
export const COMMAND_REFRESH_FILE_ROOT = "mcsManager.refreshFileRoot";
export const COMMAND_REFRESH_FILES = "mcsManager.refreshFiles";
export const COMMAND_OPEN_FILE = "mcsManager.openFile";

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
                .filter(isDirectory)
                .map((e) => e.path),
        ],
        {
            title: "select a dir to upload",
        }
    );
    if (!result) {
        return;
    }
    await GlobalVar.mcsService.uploadFile({
        daemonId: GlobalVar.currentInstance.daemonId,
        uuid: GlobalVar.currentInstance.instanceUuid,
        uploadDir: result,
        filepath: filepath,
    });
    GlobalVar.fileTreeDataProvider.refresh();
    vscode.window.showInformationMessage(
        `successfully upload ${filepath} to ${result}`
    );
}

export async function renameFileCommand(element: MCSFileItem) {
    const newName = await vscode.window.showInputBox({
        title: "new name",
    });
    if (newName) {
        GlobalVar.mcsService.renameFile(element.path, newName);
    }
}

export async function uploadFileCommand(element?: MCSFileItem) {
    if (element && !isDirectory(element)) {
        vscode.window.showErrorMessage(`${element.path} 不是目录, 无法上传`);
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
    const uploadDir = element ? element.path : "/";
    await GlobalVar.mcsService.uploadFile({
        daemonId: GlobalVar.currentInstance!.daemonId,
        uuid: GlobalVar.currentInstance!.instanceUuid,
        uploadDir: element ? element.path : "/",
        filepath: filepath,
    });
    GlobalVar.fileTreeDataProvider.refresh(element);
    vscode.window.showInformationMessage(
        `成功上传文件 ${filepath} 到 ${uploadDir}`
    );
}

export async function downloadFileCommand(element: MCSFileItem) {
    if (isDirectory(element)) {
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
    await GlobalVar.mcsService.downloadFile({
        daemonId: GlobalVar.currentInstance!.daemonId,
        uuid: GlobalVar.currentInstance!.instanceUuid,
        filepath: element.path,
        distpath: distUri.fsPath,
    });
    vscode.window.showInformationMessage(
        `成功下载文件 ${element.path} 到 ${distpath}`
    );
}

export async function createFileCommand({
    isDir = false,
    element,
}: {
    isDir?: boolean;
    element?: MCSFileItem;
}) {
    const text = isDir ? "目录" : "文件";
    if (element && !isDirectory(element)) {
        vscode.window.showErrorMessage(
            `只能在文件夹下创建${text}, 非法路径 ${element.path}`
        );
        return;
    }
    const name = await vscode.window.showInputBox({
        placeHolder: `请输入${text}路径（会自动添加${
            element ? element.path : "/"
        }）`,
    });
    if (!name) {
        return;
    }
    const filepath = element
        ? path.join(element.path, name)
        : name.startsWith("/")
        ? name
        : `/${name}`;
    const result = await GlobalVar.mcsService.mkFile({
        isDir: isDir,
        daemonId: GlobalVar.currentInstance!.daemonId,
        uuid: GlobalVar.currentInstance!.instanceUuid,
        target: filepath,
    });
    if (!result) {
        vscode.window.showErrorMessage(`创建${text} ${filepath} 失败`);
        return;
    }
    vscode.window.showInformationMessage(`创建${text} ${filepath} 成功`);
    GlobalVar.fileTreeDataProvider.refresh(element);
}

export async function deleteFilesCommand(element?: MCSFileItem) {
    const els = element ? [element] : GlobalVar.mcsFileExplorer!.selection;
    if (els.length === 0) {
        await vscode.window.showWarningMessage("要删除文件，请先选中文件");
        return;
    }
    const result = await vscode.window.showWarningMessage(
        `是否要删除删除${els.length}个文件, [${els
            .map((e) => e.path)
            .join(",")}]`,
        "Yes",
        "No"
    );
    if (result === "No") {
        return;
    }
    const currentInstance = GlobalVar.currentInstance!;
    await GlobalVar.mcsService.deleteFiles({
        daemonId: currentInstance.daemonId,
        uuid: currentInstance.instanceUuid,
        targets: els.map((e) => e.path),
    });
    GlobalVar.fileTreeDataProvider.refresh();
    vscode.window.showInformationMessage(`成功删除文件${els.length} 个文件`);
    GlobalVar.outputChannel.info(
        `成功删除文件 ${els.length} 个文件, \n\t${els
            .map((e) => e.path)
            .join("\n\t")}`
    );
}
export function refreshFileRootCommand() {
    GlobalVar.fileTreeDataProvider.refresh();
    GlobalVar.outputChannel.info("Files Root");
}

export function refreshFilesCommand(element: MCSFileItem) {
    GlobalVar.fileTreeDataProvider.refresh(element);
    GlobalVar.outputChannel.info(`Files view refreshed`, element.path);
}

export async function openFileCommand(
    fileItem: MCSFileItem,
    instance: MCSInstance
) {
    if (!instance) {
        throw Error("require instance");
    }

    // 检查是否是文本文件
    if (!isTextFile(fileItem.path)) {
        const result = await vscode.window.showWarningMessage(
            `此文件类型无法直接查看。是否需要下载？`,
            "是",
            "否"
        );

        if (result === "是") {
            await vscode.commands.executeCommand(
                COMMAND_DOWNLOAD_FILE,
                fileItem
            );
        }
        return;
    }

    // 创建mcs scheme的URI
    const uri = vscode.Uri.parse(
        buildMCSUrl({
            path: fileItem.path,
            daemonId: instance.daemonId,
            uuid: instance.instanceUuid,
        })
    );

    // 打开文档
    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(doc, {
        preview: false,
    });
}
