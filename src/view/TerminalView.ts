import { closeTerminal, executeSocket, sendCommand } from "@/api/mcs/terminal";
import * as vscode from "vscode";
import { GlobalVar } from "@/utils/global";
import path from "path";
import fs from "fs";
import { fetchInstanceTerminalText } from "@/api/mcs/instance";
import { logger } from "@/utils/log";

export interface MCSTerminalProps {
    daemonId: string;
    instanceId: string;
    instanceName: string;
}

export class TerminalView {
    static readonly viewType = "mcsTerminal";
    public static INSTANCE: TerminalView | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];
    private _websocket: any;
    _title: string;

    private constructor(
        column: vscode.ViewColumn | undefined,
        props: MCSTerminalProps
    ) {
        this._title = `MCSTerm(${props.instanceName})`;
        this._panel = vscode.window.createWebviewPanel(
            TerminalView.viewType,
            this._title,
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.file(
                        path.posix.join(
                            GlobalVar.context.extensionPath,
                            "resources"
                        )
                    ),
                ],
            }
        );
        this._panel.onDidDispose(() => {
            TerminalView.INSTANCE?.dispose();
        });
        executeSocket({
            daemonId: props.daemonId,
            instanceId: props.instanceId,
            onMessage: (msg) => {
                // 将服务器消息发送到WebView
                this._panel.webview.postMessage({
                    eventType: "terminalText",
                    data: msg,
                });
            },
        }).then((socket) => {
            console.log("连接socket成功");
            this._websocket = socket;
        });

        // 设置 WebView 内容
        this._panel.webview.html = this._getWebviewContent();

        // 处理来自 WebView 的消息（用户输入的命令）
        this._panel.webview.onDidReceiveMessage(
            (message) => {
                switch (message.eventType) {
                    case "sendCommand":
                        sendCommand(this._websocket, message.text);
                        break;
                    case "fetchAllHistory":
                        // 获取全部历史记录
                        fetchInstanceTerminalText({
                            daemonId: props.daemonId,
                            uuid: props.instanceId,
                        }).then((resp) => {
                            if (resp.base.code !== 0) {
                                logger.error(
                                    "can not fetch terminal text",
                                    JSON.stringify(resp)
                                );
                                return;
                            }
                            this._panel.webview.postMessage({
                                eventType: "clearTerminal",
                            });
                            this._panel.webview.postMessage({
                                eventType: "terminalText",
                                data: resp.base.data,
                            });
                        });
                        break;
                    case "exportTerminal":
                        vscode.workspace
                            .openTextDocument({
                                content: message.text,
                                language: "log",
                            })
                            .then((document) => {
                                vscode.window.showTextDocument(document);
                            });
                        break;
                }
            },
            null,
            this._disposables
        );
        fetchInstanceTerminalText({
            daemonId: props.daemonId,
            uuid: props.instanceId,
        }).then((resp) => {
            if (resp.base.code !== 0) {
                logger.error(
                    "can not init terminal text",
                    JSON.stringify(resp)
                );
                return;
            }
            this._panel.webview.postMessage({
                eventType: "terminalText",
                data: resp.base.data,
            });
        });
    }

    public static createOrShow(props: MCSTerminalProps) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        if (TerminalView.INSTANCE) {
            TerminalView.INSTANCE._panel.reveal(column);
            return;
        }
        TerminalView.INSTANCE = new TerminalView(column, props);
    }

    private _getWebviewContent() {
        const templatePath = path.posix.join(
            GlobalVar.context.extensionPath,
            "resources/terminal/index.html"
        );
        const templateContent = fs.readFileSync(templatePath, "utf-8");

        const cssUrls = [
            "resources/terminal/index.css",
            "resources/xterm/xterm@5.5.0.css",
        ].map((res) =>
            this._panel.webview
                .asWebviewUri(
                    vscode.Uri.file(
                        path.posix.join(GlobalVar.context.extensionPath, res)
                    )
                )
                .toString()
        );
        const jsUrls = [
            "resources/terminal/index.js",
            "resources/xterm/xterm@5.5.0.js",
            "resources/xterm/addon-fit@0.10.0.js",
            "resources/xterm/addon-search@0.15.0.js",
            "resources/xterm/addon-web-links@0.11.0.js",
        ].map((res) =>
            this._panel.webview
                .asWebviewUri(
                    vscode.Uri.file(
                        path.posix.join(GlobalVar.context.extensionPath, res)
                    )
                )
                .toString()
        );

        const indexJsUrl = jsUrls.shift()!;
        const indexCssUrl = cssUrls.shift()!;
        const resourceUrlEls = [
            ...cssUrls.map((url) => `<link rel="stylesheet" href="${url}" />`),
            ...jsUrls.map((url) => `<script src="${url}"></script>`),
        ].join("\n");

        return templateContent
            .replace("{{resourceUrlEls}}", resourceUrlEls)
            .replace("{{indexCssUrl}}", indexCssUrl)
            .replace("{{indexJsUrl}}", indexJsUrl);
    }

    public dispose() {
        TerminalView.INSTANCE = undefined;
        closeTerminal(this._websocket);
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}
