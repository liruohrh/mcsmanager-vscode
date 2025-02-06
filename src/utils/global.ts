import { MCSAPI } from "../service/mcs";
import * as vscode from "vscode";
import { MCSLoginUser } from "../types";

export class GlobalVar {
    static loginUser?: MCSLoginUser;
    static context: vscode.ExtensionContext;
    static mcsAPI: MCSAPI;
}
