import { McsService } from "../service/mcs";
import * as vscode from "vscode";
import { MCSLoginUser } from "../types";

export class GlobalVar {
    static loginUser?: MCSLoginUser;
    static context: vscode.ExtensionContext;
    static mcsService: McsService;
    static outputChannel: vscode.LogOutputChannel;
}
