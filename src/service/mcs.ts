import * as vscode from "vscode";
import { GlobalVar } from "../utils/global";
import { logger } from "../utils/log";
import { Config } from "../utils/config";
import {
    getUserInfo as getLoginUser,
    login,
    logout,
    getFileList,
    getFileContent,
    updateFileContent,
} from "../api/mcs";
import { mergeCookie, removeCookie } from "../utils/cookie";
import {
    STATE_COOKIE,
    STATE_LOGIN_COOKIE,
    STATE_LOGIN_USER,
    STATE_TOKEN,
} from "../utils/constant";
import { MCSLoginUser, MCSFileListPageResp, MCSFileListReq } from "../types";
import path from "path";

export class McsService {
    public async updateFileContent(
        daemonId: string,
        uuid: string,
        target: string,
        text: string
    ): Promise<boolean> {
        const resp = await updateFileContent({ daemonId, uuid, target, text });
        if (resp.base.code !== 0) {
            vscode.window.showErrorMessage(
                `更新文件内容失败 ${JSON.stringify(resp.base)}`
            );
            logger.error(resp.base);
            return false;
        }
        return resp.base.data || false;
    }

    public async getFileContent(
        daemonId: string,
        uuid: string,
        target: string
    ): Promise<string | boolean | undefined> {
        const resp = await getFileContent({ daemonId, uuid, target });
        if (resp.base.code !== 0) {
            vscode.window.showErrorMessage(
                `获取文件内容失败 ${JSON.stringify(resp.base)}`
            );
            logger.error(resp.base);
            return;
        }
        return resp.base.data;
    }

    public async getFileList(
        params: MCSFileListReq
    ): Promise<MCSFileListPageResp | undefined> {
        const resp = await getFileList(params);
        if (resp.base.code !== 0) {
            vscode.window.showErrorMessage(
                `获取文件列表失败 ${JSON.stringify(resp.base)}`
            );
            logger.error(resp.base);
            return;
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

    public async isLogin(): Promise<boolean> {
        const resp = await getLoginUser();
        return resp.status !== 403;
    }
    public async getLoginUser(): Promise<MCSLoginUser | undefined> {
        const resp = await getLoginUser();
        if (resp.base.code !== 0) {
            vscode.window.showErrorMessage(
                `获取登录用户信息失败 ${JSON.stringify(resp.base)}`
            );
            logger.error(resp.base);
            return;
        }
        return resp.base.data;
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
            if (loginUser) {
                this.onLogin(loginUser);
            }
            logger.info("autoLogin: 已登录");
            return;
        }
        await this.login();
        logger.info("autoLogin: 自动登录成功");
    }

    public async login(): Promise<void> {
        if (!Config.urlPrefix) {
            vscode.window.showErrorMessage(`登录失败，请配置urlPrefix`);
            return;
        }
        if (!Config.username || !Config.username) {
            vscode.window.showErrorMessage(`登录失败，请配置登录凭证`);
            return;
        }

        if (await this.isLogin()) {
            await this.logout();
        }

        const resp = await login({
            username: Config.username,
            password: Config.password,
        });

        if (resp.base.code !== 0) {
            vscode.window.showErrorMessage(
                `登录失败，请检查配置 ${JSON.stringify(resp.base)}`
            );
            logger.error(resp);
            return;
        }
        const cookies = resp.response!.headers["set-cookie"]!;
        const oldCookie =
            GlobalVar.context.globalState.get<string>(STATE_COOKIE) || "";
        GlobalVar.context.globalState.update(
            STATE_COOKIE,
            mergeCookie(cookies, oldCookie)
        );
        GlobalVar.context.globalState.update(
            STATE_LOGIN_COOKIE,
            cookies.map((cookie) => cookie.split("; ")[0])
        );
        GlobalVar.context.globalState.update(STATE_TOKEN, resp.base.data);
        logger.info("登录成功");

        const loginUser = await this.getLoginUser();
        if (loginUser) {
            this.onLogin(loginUser);
        }
    }
    public onLogin(loginUser: MCSLoginUser) {
        GlobalVar.loginUser = loginUser;
        GlobalVar.context.globalState.update(STATE_LOGIN_USER, loginUser);
    }

    public async logout(): Promise<void> {
        if (!Config.urlPrefix) {
            return;
        }
        const token = GlobalVar.context.globalState.get<string>(STATE_TOKEN);
        if (!token) {
            return;
        }
        await logout({ token });
        GlobalVar.context.globalState.update(STATE_TOKEN, undefined);
        const cookie = GlobalVar.context.globalState.get<string>(STATE_COOKIE);
        const loginCookieNames =
            GlobalVar.context.globalState.get<string[]>(STATE_LOGIN_COOKIE);
        if (cookie && loginCookieNames) {
            GlobalVar.context.globalState.update(
                STATE_COOKIE,
                removeCookie(cookie, loginCookieNames)
            );
        }
        GlobalVar.context.globalState.update(STATE_LOGIN_COOKIE, undefined);
        GlobalVar.context.globalState.update(STATE_LOGIN_USER, undefined);
        logger.info("logout: 登出成功");
    }
}
