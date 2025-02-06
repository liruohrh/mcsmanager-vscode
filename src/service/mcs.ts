import * as vscode from "vscode";
import { GlobalVar } from "../utils/global";
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
import {
    MCSLoginUser,
    MCSFileListPageResp,
    MCSFileListReq,
    MCSFileItem,
    PageResp,
} from "../types";
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
            throw Error(`更新文件内容失败 ${JSON.stringify(resp.base)}`);
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
            throw Error(`获取文件内容失败 ${JSON.stringify(resp.base)}`);
        }
        return resp.base.data;
    }

    public async getAllFileList(
        params: MCSFileListReq
    ): Promise<PageResp<MCSFileItem> | undefined> {
        const fileItems: MCSFileItem[] = [];
        params.page_size = 5;
        for (let i = 0; true; i++) {
            params.page = i;
            const resp = await getFileList(params);
            if (resp.base.code !== 0) {
                throw Error(
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
    ): Promise<MCSFileListPageResp | undefined> {
        const resp = await getFileList(params);
        if (resp.base.code !== 0) {
            throw Error(`获取文件列表失败 ${JSON.stringify(resp.base)}`);
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
            throw Error(`获取登录用户信息失败 ${JSON.stringify(resp.base)}`);
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
            GlobalVar.outputChannel.info("autoLogin: 已登录");
            return;
        }
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

        if (await this.isLogin()) {
            await this.logout();
        }

        const resp = await login({
            username: Config.username,
            password: Config.password,
        });

        if (resp.base.code !== 0) {
            throw Error(`登录失败，请检查配置 ${JSON.stringify(resp.base)}`);
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
        GlobalVar.outputChannel.info("登录成功");
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
        // 忽视错误
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
        GlobalVar.outputChannel.info("logout: 登出成功");
    }
}
