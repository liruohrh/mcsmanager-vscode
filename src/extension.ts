import * as vscode from "vscode";
import { MCSFileTreeView } from "./views/MCSFileTreeView";
import { MCSAPI } from "./service/mcs";
import { GlobalVar } from "./utils/global";
import { logger } from "./utils/log";

export function activate(context: vscode.ExtensionContext) {
    GlobalVar.context = context;
    GlobalVar.mcsAPI = new MCSAPI();

    logger.info("activate");
    //
    GlobalVar.mcsAPI.autoLogin();
    //view
    const mcsProvider = new MCSFileTreeView();
    vscode.window.registerTreeDataProvider("mcsManager", mcsProvider);

    //cmd
    context.subscriptions.push(
        vscode.commands.registerCommand("mcsManager.login", () =>
            GlobalVar.mcsAPI.login()
        )
    );
}

export function deactivate() {
    logger.info("deactivate");
    logger.info({
        authToken: GlobalVar.context.globalState.get<string>("authToken"),
    });
}
