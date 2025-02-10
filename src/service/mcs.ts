import * as vscode from "vscode";
import path from "path";
import fs from "fs";
import { GlobalVar } from "@/utils/global";
import { Config } from "@/utils/config";
import {
    getUserInfo as getLoginUser,
    login,
    logout,
    getFileList,
    getFileContent,
    updateFileContent,
    deleteFiles,
    createFile,
    createDir,
    getFileConfig,
    uploadFile,
    downloadFile,
    moveFile,
} from "@/api/mcs";
import { mergeCookie, removeCookie } from "@/utils/cookie";
import {
    STATE_COOKIE,
    STATE_LOGIN_COOKIE,
    STATE_LOGIN_USER,
    STATE_TOKEN,
    STATE_SELECTED_INSTANCE,
} from "@/utils/constant";
import {
    MCSLoginUser,
    MCSFileListPageResp,
    MCSFileListReq,
    MCSFileItem,
    PageResp,
    MCSInstance,
} from "@/types";
import { isDirectory } from "@/utils/mcs";

export class McsService {
    public async renameFile(filepath: string, newName: string): Promise<void> {
        if (!GlobalVar.currentInstance) {
            throw vscode.FileSystemError.NoPermissions(
                "require select instance"
            );
        }
        const filename = path.basename(filepath);
        if (filename === newName) {
            vscode.window.showWarningMessage(
                `rename fail, new name(${newName}) is equal old name(${filename})`
            );
            return;
        }
        const newPath = path.join(path.dirname(filepath), newName);
        const resp = await moveFile({
            daemonId: GlobalVar.currentInstance.daemonId,
            uuid: GlobalVar.currentInstance.instanceUuid,
            targets: [[filepath, newPath]],
        });
        if (resp.base.code !== 0) {
            throw Error(
                `fail to rename file ${filepath} to ${newPath} ${JSON.stringify(
                    resp.base
                )}`
            );
        }
        GlobalVar.fileTreeDataProvider.refresh();
        vscode.window.showInformationMessage("Rename File success");
    }

    public async moveFile(
        sources: MCSFileItem[],
        targetDir: MCSFileItem
    ): Promise<void> {
        if (!targetDir || sources.length === 0 || !GlobalVar.currentInstance) {
            return;
        }
        let dirPath = targetDir.path;
        if (
            !isDirectory(targetDir) &&
            (sources.length > 1 || path.dirname(sources[0].path) !== dirPath)
        ) {
            dirPath = path.dirname(targetDir.path);
            const result = await vscode.window.showErrorMessage(
                `Can't move multiple files to a file, Whether to change target dir ${targetDir.path} to ${dirPath}`,
                "Yes",
                "No"
            );
            if (result !== "Yes") {
                return;
            }
        }
        const targets: string[][] = [];
        for (const item of sources) {
            targets.push([
                item.path,
                path.join(dirPath, path.basename(item.path)),
            ]);
        }
        const resp = await moveFile({
            daemonId: GlobalVar.currentInstance.daemonId,
            uuid: GlobalVar.currentInstance.instanceUuid,
            targets,
        });
        if (resp.base.code !== 0) {
            throw Error(`fail to move file ${JSON.stringify(resp.base)}`);
        }
        GlobalVar.fileTreeDataProvider.refresh();
        vscode.window.showInformationMessage("Move success");
        GlobalVar.outputChannel.info("Move Files success", targets);
    }

    public async downloadFile({
        filepath,
        distpath,
    }: {
        filepath: string;
        distpath?: string;
    }): Promise<Uint8Array | undefined> {
        const instance = GlobalVar.currentInstance;
        if (!instance) {
            throw vscode.FileSystemError.NoPermissions(
                "require select instance"
            );
        }
        const daemonId = instance.daemonId;
        const uuid = instance.instanceUuid;

        const resp = await getFileConfig({
            daemonId,
            uuid,
            fileName: filepath,
        });
        if (resp.base.code !== 0) {
            throw new vscode.FileSystemError(
                `获取文件配置失败 ${JSON.stringify(resp.base)}`
            );
        }
        let addr = resp.base.data!.addr;
        if (addr.startsWith("wss://")) {
            addr = addr.replace("wss://", "");
        }
        const resp2 = await downloadFile({
            password: resp.base.data!.password,
            addr: addr,
            downloadFilename: path.basename(filepath),
        });
        if (resp2.base.code !== 0) {
            throw new vscode.FileSystemError(
                `下载文件失败 ${JSON.stringify(resp2.base)}`
            );
        }
        if (distpath) {
            fs.writeFileSync(distpath, resp2.base.data!);
            return;
        }
        return resp2.base.data!;
    }

    /**
     * 默认覆盖路径,目录不存在自动创建
     */
    public async uploadFile({
        uploadDir,
        filepath,
        content,
    }: {
        uploadDir: string;
        filepath: string;
        content?: Uint8Array;
    }): Promise<void> {
        const instance = GlobalVar.currentInstance;
        if (!instance) {
            throw vscode.FileSystemError.NoPermissions(
                "require select instance"
            );
        }
        const daemonId = instance.daemonId;
        const uuid = instance.instanceUuid;

        const resp = await getFileConfig({ daemonId, uuid, uploadDir });
        if (resp.base.code !== 0) {
            throw new vscode.FileSystemError(
                `获取文件配置失败 ${JSON.stringify(resp.base)}`
            );
        }
        let addr = resp.base.data!.addr;
        if (addr.startsWith("wss://")) {
            addr = addr.replace("wss://", "");
        }
        const resp2 = await uploadFile({
            password: resp.base.data!.password,
            addr,
            filepath: filepath,
            file: content,
        });
        if (resp2.base.code !== 0) {
            throw new vscode.FileSystemError(
                `上传文件失败 ${JSON.stringify(resp2.base)}`
            );
        }
    }
    public async mkFile({
        isDir,
        target,
    }: {
        isDir: boolean;
        target: string;
    }): Promise<boolean> {
        if (isDir) {
            return this.createDir(target);
        } else {
            return this.createFile(target);
        }
    }
    public async createDir(target: string): Promise<boolean> {
        const instance = GlobalVar.currentInstance;
        if (!instance) {
            throw vscode.FileSystemError.NoPermissions(
                "require select instance"
            );
        }
        const daemonId = instance.daemonId;
        const uuid = instance.instanceUuid;

        const resp = await createDir({ daemonId, uuid, target });
        if (resp.base.code !== 0) {
            throw new vscode.FileSystemError(
                `创建目录失败 ${JSON.stringify(resp.base)}`
            );
        }
        return resp.base.data!;
    }
    public async createFile(target: string): Promise<boolean> {
        const instance = GlobalVar.currentInstance;
        if (!instance) {
            throw vscode.FileSystemError.NoPermissions(
                "require select instance"
            );
        }
        const daemonId = instance.daemonId;
        const uuid = instance.instanceUuid;
        const resp = await createFile({ daemonId, uuid, target });
        if (resp.base.code !== 0) {
            throw new vscode.FileSystemError(
                `创建文件失败 ${JSON.stringify(resp.base)}`
            );
        }
        return resp.base.data!;
    }
    public async deleteFiles(targets: string[]): Promise<boolean> {
        const instance = GlobalVar.currentInstance;
        if (!instance) {
            throw vscode.FileSystemError.NoPermissions(
                "require select instance"
            );
        }
        const daemonId = instance.daemonId;
        const uuid = instance.instanceUuid;

        const resp = await deleteFiles({ daemonId, uuid, targets });
        if (resp.base.code !== 0) {
            throw new vscode.FileSystemError(
                `删除文件失败 ${JSON.stringify(resp.base)}`
            );
        }
        return resp.base.data!;
    }
    public async updateFileContent(
        daemonId: string,
        uuid: string,
        target: string,
        text: string
    ): Promise<boolean> {
        const resp = await updateFileContent({ daemonId, uuid, target, text });
        if (resp.base.code !== 0) {
            throw new vscode.FileSystemError(
                `更新文件内容失败 ${JSON.stringify(resp.base)}`
            );
        }
        return resp.base.data!;
    }

    public async getFileContent(target: string): Promise<string> {
        const instance = GlobalVar.currentInstance;
        if (!instance) {
            throw vscode.FileSystemError.NoPermissions(
                "require select instance"
            );
        }
        const daemonId = instance.daemonId;
        const uuid = instance.instanceUuid;

        const resp = await getFileContent({ daemonId, uuid, target });
        if (resp.base.code !== 0) {
            throw new vscode.FileSystemError(
                `获取文件内容失败 ${JSON.stringify(resp.base)}`
            );
        }
        if (resp.base.data! === true) {
            return "";
        }
        return resp.base.data as string;
    }

    public async getAllFileList(
        params: MCSFileListReq
    ): Promise<PageResp<MCSFileItem>> {
        const instance = GlobalVar.currentInstance;
        if (!instance) {
            throw vscode.FileSystemError.NoPermissions(
                "require select instance"
            );
        }
        const daemonId = instance.daemonId;
        const uuid = instance.instanceUuid;

        const fileItems: MCSFileItem[] = [];
        for (let i = 0; true; i++) {
            params.page = i;
            const resp = await getFileList({ daemonId, uuid, ...params });
            if (resp.base.code !== 0) {
                if (resp.base.message?.includes("Illegal access path")) {
                    throw vscode.FileSystemError.FileNotFound(
                        resp.base.message!
                    );
                }
                throw new vscode.FileSystemError(
                    `第 ${i + 1} 次获取文件列表失败 ${JSON.stringify(
                        resp.base
                    )}`
                );
            }

            // 处理每个文件项的path
            const items = resp.base.data!.items.map((item) => ({
                ...item,
                path: path.posix.join(params.target, item.name),
            }));
            fileItems.push(...items);
            if (resp.base.data?.total === fileItems.length) {
                GlobalVar.outputChannel.info(
                    `执行了 ${i + 1} 次 获取 ${params.target} 文件列表， 共 ${
                        fileItems.length
                    }文件`
                );
                break;
            }
        }
        return {
            data: fileItems,
            total: fileItems.length,
            page: 0,
            pageSize: fileItems.length,
        };
    }
    public async getFileList(
        params: MCSFileListReq
    ): Promise<MCSFileListPageResp> {
        const instance = GlobalVar.currentInstance;
        if (!instance) {
            throw vscode.FileSystemError.NoPermissions(
                "require select instance"
            );
        }
        const daemonId = instance.daemonId;
        const uuid = instance.instanceUuid;

        const resp = await getFileList({
            ...params,
            daemonId,
            uuid,
        });
        if (resp.base.code !== 0) {
            if (resp.base.message?.includes("Illegal access path")) {
                throw vscode.FileSystemError.FileNotFound(resp.base.message!);
            }
            throw new vscode.FileSystemError(
                `获取文件列表失败 ${JSON.stringify(resp.base)}`
            );
        }

        // 处理每个文件项的path
        const items = resp.base.data!.items.map((item) => ({
            ...item,
            path: path.posix.join(params.target, item.name),
        }));

        return {
            ...resp.base.data!,
            items,
        };
    }
    /**
     * 通过内存登录态，基本能判断有无登录
     */
    public async isLogin2(): Promise<boolean> {
        return !!GlobalVar.loginUser;
    }
    /**
     * 通过获取用户信息来判断有无登录，更加精准
     */
    public async isLogin(): Promise<boolean> {
        const resp = await getLoginUser();
        return resp.status !== 403;
    }
    public async getLoginUser(): Promise<MCSLoginUser> {
        const resp = await getLoginUser();
        if (resp.base.code !== 0) {
            throw Error(`获取登录用户信息失败 ${JSON.stringify(resp.base)}`);
        }
        return resp.base.data!;
    }

    public async autoLogin(): Promise<void> {
        if (
            !Config.autoLogin ||
            !Config.urlPrefix ||
            !Config.username ||
            !Config.password
        ) {
            return;
        }
        if (await this.isLogin()) {
            const loginUser = await this.getLoginUser();
            await this.onLogin(loginUser!);
            GlobalVar.outputChannel.info("autoLogin: 已登录");
            return;
        }
        await this.clearLoginData();
        await this.login();
        GlobalVar.outputChannel.info("autoLogin: 自动登录成功");
    }

    public async login(): Promise<void> {
        if (!Config.urlPrefix) {
            throw Error(`登录失败，请配置urlPrefix`);
        }
        if (!Config.username || !Config.username) {
            throw Error(`登录失败，请配置登录凭证`);
        }
        if (GlobalVar.isSigningIn) {
            return;
        }
        GlobalVar.isSigningIn = true;

        try {
            if (await this.isLogin2()) {
                await this.logout();
            }

            const resp = await login({
                username: Config.username,
                password: Config.password,
            });

            if (resp.base.code !== 0) {
                throw Error(
                    `登录失败，请检查配置 ${JSON.stringify(resp.base)}`
                );
            }
            const cookies = resp.response!.headers["set-cookie"]!;
            const oldCookie =
                GlobalVar.context.globalState.get<string>(STATE_COOKIE) || "";
            await GlobalVar.context.globalState.update(
                STATE_COOKIE,
                mergeCookie(cookies, oldCookie)
            );
            const loginUser = await this.getLoginUser();
            await GlobalVar.context.globalState.update(
                STATE_LOGIN_COOKIE,
                cookies.map((cookie) => cookie.split("; ")[0])
            );
            await GlobalVar.context.globalState.update(
                STATE_TOKEN,
                resp.base.data
            );
            await this.onLogin(loginUser);
            GlobalVar.outputChannel.info("登录成功");
        } finally {
            GlobalVar.isSigningIn = false;
        }
    }
    public async onLogin(loginUser: MCSLoginUser): Promise<void> {
        GlobalVar.loginUser = loginUser;
        await GlobalVar.context.globalState.update(STATE_LOGIN_USER, loginUser);
        await vscode.commands.executeCommand(
            "setContext",
            "mcsManager.isLoggedIn",
            true
        );

        // 恢复选中的实例
        const selectedInstance = GlobalVar.context.globalState.get<MCSInstance>(
            STATE_SELECTED_INSTANCE
        );
        if (selectedInstance) {
            // 检查选中的实例是否还存在
            const instance = loginUser.instances.find(
                (i) => i.instanceUuid === selectedInstance.instanceUuid
            );
            if (instance) {
                GlobalVar.currentInstance = instance;
                await vscode.commands.executeCommand(
                    "setContext",
                    "mcsManager.hasSelectedInstance",
                    true
                );
                GlobalVar.outputChannel.info(
                    `恢复选中实例: ${instance.nickname}`
                );
                return;
            }
        }
    }

    public async logout(): Promise<void> {
        if (!Config.urlPrefix) {
            throw Error(`登出失败，请配置urlPrefix`);
        }
        const token = GlobalVar.context.globalState.get<string>(STATE_TOKEN);
        if (!token) {
            throw Error(`登出失败，无法获取持久化的token`);
        }
        // 忽视错误
        await logout({ token });
        await this.clearLoginState();
        await this.clearLoginMemoState();
        GlobalVar.outputChannel.info("logout: 登出成功");
    }
    /**
     * 开启插件时需要重新获取的、非内存变量
     */
    public async clearLoginState(): Promise<void> {
        await GlobalVar.context.globalState.update(STATE_LOGIN_USER, undefined);
    }
    public async clearLoginMemoState(): Promise<void> {
        GlobalVar.loginUser = undefined;
        GlobalVar.currentInstance = undefined;
        await vscode.commands.executeCommand(
            "setContext",
            "mcsManager.isLoggedIn",
            false
        );
        await vscode.commands.executeCommand(
            "setContext",
            "mcsManager.hasSelectedInstance",
            false
        );
    }
    /**
     * 登录态、内存变量
     */
    public async clearLoginData(): Promise<void> {
        await GlobalVar.context.globalState.update(STATE_TOKEN, undefined);
        await this.removeLoginCookie();

        await GlobalVar.context.globalState.update(
            STATE_SELECTED_INSTANCE,
            undefined
        );
        await this.clearLoginMemoState();
        await this.clearLoginState();
    }
    public async removeLoginCookie(): Promise<void> {
        const cookie = GlobalVar.context.globalState.get<string>(STATE_COOKIE);
        const loginCookieNames =
            GlobalVar.context.globalState.get<string[]>(STATE_LOGIN_COOKIE);
        if (cookie && loginCookieNames) {
            await GlobalVar.context.globalState.update(
                STATE_COOKIE,
                removeCookie(cookie, loginCookieNames)
            );
        }
        await GlobalVar.context.globalState.update(
            STATE_LOGIN_COOKIE,
            undefined
        );
    }
}
