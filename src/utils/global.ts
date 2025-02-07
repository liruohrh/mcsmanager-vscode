import * as vscode from "vscode";
import { McsService } from "../service/mcs";
import { MCSInstance, MCSLoginUser } from "../types";

export class GlobalVar {
    static loginUser?: MCSLoginUser;
    static currentInstance?: MCSInstance;
    static context: vscode.ExtensionContext;
    static mcsService: McsService;
    static outputChannel: vscode.LogOutputChannel;
}
