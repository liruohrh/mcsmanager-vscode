import * as vscode from "vscode";
import { McsService } from "@/service/mcs";
import { MCSInstance, MCSLoginUser } from "@/types";
import { MCSFileTreeDataProvider } from "@/view/file/provider";
import { MCSInstanceTreeDataProvider } from "@/view/instance/provider";
import { Entry, MCSFileSystemProvider } from "@/filesystem/mcs";

export class GlobalVar {
    static clickedFileEntryCount: number = 0;
    static fileSystemProvider: MCSFileSystemProvider;
    static instanceTreeDataProvider: MCSInstanceTreeDataProvider;
    static mcsFileExplorer: vscode.TreeView<Entry>;
    static fileTreeDataProvider: MCSFileTreeDataProvider;
    static loginUser?: MCSLoginUser;
    static currentInstance?: MCSInstance;
    static context: vscode.ExtensionContext;
    static mcsService: McsService;
    static outputChannel: vscode.LogOutputChannel;
}
