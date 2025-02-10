import * as vscode from "vscode";
import { McsService } from "@/service/mcs";
import { MCSFileItem, MCSInstance, MCSLoginUser } from "@/types";
import { MCSFileTreeDataProvider } from "@/view/file/provider";
import { MCSInstanceTreeDataProvider } from "@/view/instance/provider";
import { MCSFileSystemProvider } from "@/filesystem/mcs";

export class GlobalVar {
    static fileSystemProvider: MCSFileSystemProvider;
    static instanceTreeDataProvider: MCSInstanceTreeDataProvider;
    static mcsFileExplorer: vscode.TreeView<MCSFileItem>;
    static fileTreeDataProvider: MCSFileTreeDataProvider;
    static isSigningIn = false;
    static loginUser?: MCSLoginUser;
    static currentInstance?: MCSInstance;
    static context: vscode.ExtensionContext;
    static mcsService: McsService;
    static outputChannel: vscode.LogOutputChannel;
}
