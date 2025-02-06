import * as vscode from "vscode";
import { MCSFileTreeDataProvider } from "./views/MCSFileTreeView";
import { McsService } from "./service/mcs";
import { GlobalVar } from "./utils/global";
import { logger } from "./utils/log";

export function activate(context: vscode.ExtensionContext) {
    GlobalVar.context = context;
    GlobalVar.mcsService = new McsService();

    logger.info("activate");
    //
    GlobalVar.mcsService.autoLogin();
    //view
    const mcsProvider = new MCSFileTreeDataProvider();
    vscode.window.registerTreeDataProvider("mcsManager", mcsProvider);

    //cmd
    context.subscriptions.push(
        vscode.commands.registerCommand("mcsManager.login", () =>
            GlobalVar.mcsService.login()
        )
    );
}

export function deactivate() {
    logger.info("deactivate");
    logger.info({
        authToken: GlobalVar.context.globalState.get<string>("authToken"),
    });
}
