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
    copyFile,
} from "@/api/mcs";
import { mergeCookie, removeCookie } from "@/utils/cookie";
import {
    STATE_COOKIE,
    STATE_LOGIN_COOKIE_NAME,
    STATE_LOGIN_USER,
    STATE_TOKEN,
    STATE_SELECTED_INSTANCE,
    CONTEXT_IS_LOGGED_IN,
    CONTEXT_HAS_SELECTED_INSTANCE,
} from "@/utils/constant";
import {
    MCSLoginUser,
    MCSFileListPageResp,
    MCSFileListReq,
    MCSFileItem,
    PageResp,
    MCSInstance,
} from "@/types";
import { defaultFileErrorGetter, logger } from "@/utils/log";

export class McsService {
    public async copyFiles(
        targetPaths: string[],
        distDirPath: string
    ): Promise<void> {
        if (targetPaths.length === 0) {
            return;
        }
        const instance = this.currentInstance;
        const targets: string[][] = [];
        for (const targetPath of targetPaths) {
            targets.push([
                targetPath,
                path.posix.join(distDirPath, path.posix.basename(targetPath)),
            ]);
        }
        const resp = await copyFile({
            daemonId: instance.daemonId,
            uuid: instance.instanceUuid,
            targets,
        });
        if (resp.base.code !== 0) {
            throw logger.terror({
                message: `Failed to copy file ${JSON.stringify(resp.base)}`,
                errorGetter: defaultFileErrorGetter,
            });
        }
        logger.info({
            message: `Success to copy Files to ${distDirPath}`,
            args: [targets],
        });
    }

    public async moveFile(oldPath: string, newPath: string): Promise<void> {
        const instance = this.currentInstance;
        if (oldPath === newPath) {
            throw logger.terror({
                message: `Failed to rename file, newPath(${newPath}) is equal newPath(${oldPath})`,
                errorGetter: defaultFileErrorGetter,
            });
        }
        const resp = await moveFile({
            daemonId: instance.daemonId,
            uuid: instance.instanceUuid,
            targets: [[oldPath, newPath]],
        });
        if (resp.base.code !== 0) {
            throw logger.terror({
                message: `Failed to rename file ${oldPath} to ${newPath} ${JSON.stringify(
                    resp.base
                )}`,
                errorGetter: defaultFileErrorGetter,
            });
        }
        logger.info({
            message: `Success to move ${oldPath} to ${newPath}`,
        });
    }

    public async moveFiles(
        oldPaths: string[],
        targetDirPath: string
    ): Promise<void> {
        if (oldPaths.length === 0) {
            return;
        }
        const instance = this.currentInstance;
        const targets: string[][] = [];
        for (const oldPath of oldPaths) {
            targets.push([
                oldPath,
                path.posix.join(targetDirPath, path.posix.basename(oldPath)),
            ]);
        }
        const resp = await moveFile({
            daemonId: instance.daemonId,
            uuid: instance.instanceUuid,
            targets,
        });
        if (resp.base.code !== 0) {
            throw logger.terror({
                message: `Failed to move file ${JSON.stringify(resp.base)}`,
                errorGetter: defaultFileErrorGetter,
            });
        }
        logger.info({
            message: `Success to move Files to ${targetDirPath}`,
            args: [targets],
        });
    }

    public async downloadFile({
        filepath,
        distpath,
    }: {
        filepath: string;
        distpath?: string;
    }): Promise<Uint8Array | undefined> {
        const instance = this.currentInstance;
        const daemonId = instance.daemonId;
        const uuid = instance.instanceUuid;

        const resp = await getFileConfig({
            daemonId,
            uuid,
            fileName: filepath,
        });
        if (resp.base.code !== 0) {
            throw logger.terror({
                message: `Failed to get download file config, ${JSON.stringify(
                    resp.base
                )}`,
                errorGetter: defaultFileErrorGetter,
            });
        }
        let addr = resp.base.data!.addr;
        if (addr.startsWith("wss://")) {
            addr = addr.replace("wss://", "");
        }
        const resp2 = await downloadFile({
            password: resp.base.data!.password,
            addr: addr,
            downloadFilename: path.posix.basename(filepath),
        });
        if (resp2.base.code !== 0) {
            throw logger.terror({
                message: `Failed to download file, ${JSON.stringify(
                    resp2.base
                )}`,
                errorGetter: defaultFileErrorGetter,
            });
        }
        if (distpath) {
            fs.writeFileSync(distpath, resp2.base.data!);
            return;
        }
        logger.info({
            message: `Success to  download File ${filepath}${
                distpath ? ` to ${distpath}` : ""
            }`,
        });
        return resp2.base.data!;
    }

    /**
     * 默认覆盖路径,目录不存在自动创建
     */
    // 上传文件
    public async uploadFile({
        uploadDir,
        filepath,
        content,
    }: {
        uploadDir: string;
        filepath: string;
        content?: Uint8Array;
    }): Promise<void> {
        const instance = this.currentInstance;
        const daemonId = instance.daemonId;
        const uuid = instance.instanceUuid;

        // 获取文件配置
        const resp = await getFileConfig({ daemonId, uuid, uploadDir });
        // 如果获取文件配置失败，抛出错误
        if (resp.base.code !== 0) {
            throw logger.terror({
                message: `Failed to get upload file config, ${JSON.stringify(
                    resp.base
                )}`,
                errorGetter: defaultFileErrorGetter,
            });
        }
        // 获取文件配置中的addr
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
            throw logger.terror({
                message: `Failed to upload file, ${JSON.stringify(resp2.base)}`,
                errorGetter: defaultFileErrorGetter,
            });
        }
        logger.info({
            message: `Success to upload File ${filepath} to ${uploadDir}`,
        });
    }
    public async mkFile({
        isDir = false,
        target,
    }: {
        isDir?: boolean;
        target: string;
    }): Promise<boolean> {
        if (isDir) {
            return this.createDir(target);
        } else {
            return this.createFile(target);
        }
    }
    public async createDir(target: string): Promise<boolean> {
        const instance = this.currentInstance;
        const daemonId = instance.daemonId;
        const uuid = instance.instanceUuid;

        const resp = await createDir({ daemonId, uuid, target });
        if (resp.base.code !== 0) {
            throw logger.terror({
                message: `Failed to create dir, ${JSON.stringify(resp.base)}`,
                errorGetter: defaultFileErrorGetter,
            });
        }
        logger.info({
            message: `Success to mkdir ${target}`,
        });
        return resp.base.data!;
    }
    public async createFile(target: string): Promise<boolean> {
        const instance = this.currentInstance;
        const resp = await createFile({
            daemonId: instance.daemonId,
            uuid: instance.instanceUuid,
            target,
        });
        if (resp.base.code !== 0) {
            throw logger.terror({
                message: `Failed to create file, ${JSON.stringify(resp.base)}`,
                errorGetter: defaultFileErrorGetter,
            });
        }
        logger.info({
            message: `Success to mk file ${target}`,
        });
        return resp.base.data!;
    }
    public async deleteFiles(targets: string[]): Promise<boolean> {
        const instance = this.currentInstance;

        const resp = await deleteFiles({
            daemonId: instance.daemonId,
            uuid: instance.instanceUuid,
            targets,
        });
        if (resp.base.code !== 0) {
            throw logger.terror({
                message: `Failed to delete file, ${JSON.stringify(resp.base)}`,
                errorGetter: defaultFileErrorGetter,
            });
        }
        logger.info({
            message: `Success to delete files`,
            args: [targets],
        });
        return resp.base.data!;
    }
    public async updateFileContent(
        target: string,
        text: string
    ): Promise<boolean> {
        const instance = this.currentInstance;
        const resp = await updateFileContent({
            daemonId: instance.daemonId,
            uuid: instance.instanceUuid,
            target,
            text,
        });
        if (resp.base.code !== 0) {
            throw logger.terror({
                message: `Failed to update file, ${JSON.stringify(resp.base)}`,
                errorGetter: defaultFileErrorGetter,
            });
        }
        logger.info({
            message: `Success to update ${target}`,
        });
        return resp.base.data!;
    }

    public async getFileContent(target: string): Promise<string> {
        const instance = this.currentInstance;
        const resp = await getFileContent({
            daemonId: instance.daemonId,
            uuid: instance.instanceUuid,
            target,
        });
        if (resp.base.code !== 0) {
            throw logger.terror({
                message: `Failed to  read file, ${JSON.stringify(resp.base)}`,
                errorGetter: defaultFileErrorGetter,
            });
        }
        if (resp.base.data! === true) {
            return "";
        }
        logger.info({
            message: `Success to get content of ${target}`,
        });
        return resp.base.data as string;
    }

    /**
     * 避免加载多次。
     * 1. 但是祖孙目录加载仍然一起，祖会覆盖原来的，导致孙去加载夫父。
     * 2. 如果是父子，则子会等待父的promise
     */
    isGettingPathSet = new Map<string, Promise<PageResp<MCSFileItem>>>();
    public async getAllFileList(
        params: MCSFileListReq
    ): Promise<PageResp<MCSFileItem>> {
        const instance = this.currentInstance;
        const isGetting = this.isGettingPathSet.get(params.target);
        if (isGetting) {
            return await isGetting;
        }
        const promise = Promise.resolve()
            .then(async () => {
                const fileItems: MCSFileItem[] = [];
                for (let i = 0; true; i++) {
                    params.page = i;
                    const resp = await getFileList({
                        daemonId: instance.daemonId,
                        uuid: instance.instanceUuid,
                        ...params,
                    });
                    if (resp.base.code !== 0) {
                        if (
                            resp.base.message?.includes("Illegal access path")
                        ) {
                            throw logger.terror({
                                message: `Failed to get the file list for the ${
                                    i + 1
                                }th time, ${
                                    resp.base.message
                                }, ${JSON.stringify(resp.base)}`,
                                errorGetter:
                                    vscode.FileSystemError.FileNotFound,
                            });
                        }
                        throw logger.terror({
                            message: `Failed to get the file list for the ${
                                i + 1
                            }th time, ${JSON.stringify(resp.base)}`,
                            errorGetter: defaultFileErrorGetter,
                        });
                    }

                    // 处理每个文件项的path
                    const items = resp.base.data!.items.map((item) => ({
                        ...item,
                        path: path.posix.join(params.target, item.name),
                    }));
                    fileItems.push(...items);
                    if (resp.base.data?.total === fileItems.length) {
                        logger.info({
                            message: `Success to execute ${
                                i + 1
                            } times to get the file list of ${
                                params.target
                            }, a total of ${fileItems.length} files`,
                        });
                        break;
                    }
                }
                return {
                    data: fileItems,
                    total: fileItems.length,
                    page: 0,
                    pageSize: fileItems.length,
                };
            })
            .finally(() => {
                this.isGettingPathSet.delete(params.target);
            });
        this.isGettingPathSet.set(params.target, promise);
        return promise;
    }
    public async getFileList(
        params: MCSFileListReq
    ): Promise<MCSFileListPageResp> {
        const instance = this.currentInstance;
        const resp = await getFileList({
            ...params,
            daemonId: instance.daemonId,
            uuid: instance.instanceUuid,
        });
        if (resp.base.code !== 0) {
            if (resp.base.message?.includes("Illegal access path")) {
                throw logger.terror({
                    message: `Failed to get the file list, ${
                        resp.base.message
                    }, ${JSON.stringify(resp.base)}`,
                    errorGetter: vscode.FileSystemError.FileNotFound,
                });
            }
            throw logger.terror({
                message: `Failed to get the file list, ${JSON.stringify(
                    resp.base
                )}`,
                errorGetter: defaultFileErrorGetter,
            });
        }

        // 处理每个文件项的path
        const items = resp.base.data!.items.map((item) => ({
            ...item,
            path: path.posix.join(params.target, item.name),
        }));
        logger.info({
            message: `Success to get the file list of ${params.target}, a total of ${resp.base.data?.items?.length} files`,
        });
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
            throw logger.terror({
                message: `Failed to get LoginUser, ${JSON.stringify(
                    resp.base
                )}`,
            });
        }
        logger.info({
            message: `Success to get LoginUser`,
        });
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
            logger.info({
                message: "autoLogin: already login, directly get LoginUser",
            });
            return;
        }
        await this.clearLoginData();
        await this.login();
        logger.info({
            message: "Success to autoLogin",
        });
    }

    public async login(): Promise<void> {
        if (GlobalVar.isSigningIn) {
            return;
        }
        GlobalVar.isSigningIn = true;

        if (!Config.urlPrefix || !Config.username || !Config.password) {
            throw logger.terror({
                message: `Failed to Login, require urlPrefix | username | password`,
            });
        }

        try {
            if (await this.isLogin2()) {
                await this.logout();
            }

            const resp = await login({
                username: Config.username,
                password: Config.password,
            });

            if (resp.base.code !== 0) {
                throw logger.terror({
                    message: `Failed to Login, ${JSON.stringify(resp.base)}`,
                });
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
                STATE_LOGIN_COOKIE_NAME,
                cookies.map((cookie) => cookie.split("=", 2)[0])
            );
            await GlobalVar.context.globalState.update(
                STATE_TOKEN,
                resp.base.data
            );
            await this.onLogin(loginUser);
            logger.info({
                message: "Success to Login",
            });
        } finally {
            GlobalVar.isSigningIn = false;
        }
    }
    public async onLogin(loginUser: MCSLoginUser): Promise<void> {
        GlobalVar.loginUser = loginUser;
        await GlobalVar.context.globalState.update(STATE_LOGIN_USER, loginUser);
        await vscode.commands.executeCommand(
            "setContext",
            CONTEXT_IS_LOGGED_IN,
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
                    CONTEXT_HAS_SELECTED_INSTANCE,
                    true
                );
                logger.info({
                    message: `OnLogin: recover old selected instance, ${instance.nickname}`,
                });
                return;
            }
        }
    }

    public async logout(): Promise<void> {
        if (!Config.urlPrefix) {
            throw logger.terror({
                message: `Failed to logout, require urlPrefix`,
                errorGetter: defaultFileErrorGetter,
            });
        }
        const token = GlobalVar.context.globalState.get<string>(STATE_TOKEN);
        if (!token) {
            throw logger.terror({
                message: `Failed to logout, require token`,
                errorGetter: defaultFileErrorGetter,
            });
        }
        // 忽视错误
        await logout({ token });
        await this.clearLoginData();
        logger.info({
            message: "Success to logout",
        });
    }
    /**
     * 开启插件时需要重新获取的、非内存变量
     */
    public async clearLoginState(): Promise<void> {
        await GlobalVar.context.globalState.update(STATE_TOKEN, undefined);
        await GlobalVar.context.globalState.update(STATE_LOGIN_USER, undefined);
        await GlobalVar.context.globalState.update(STATE_COOKIE, undefined);
        await GlobalVar.context.globalState.update(
            STATE_LOGIN_COOKIE_NAME,
            undefined
        );
        await GlobalVar.context.globalState.update(
            STATE_SELECTED_INSTANCE,
            undefined
        );
    }
    public async clearLoginMemoState(): Promise<void> {
        GlobalVar.loginUser = undefined;
        GlobalVar.currentInstance = undefined;
        await vscode.commands.executeCommand(
            "setContext",
            CONTEXT_IS_LOGGED_IN,
            false
        );
        await vscode.commands.executeCommand(
            "setContext",
            CONTEXT_HAS_SELECTED_INSTANCE,
            false
        );
    }
    /**
     * 登录态、内存变量
     */
    public async clearLoginData(): Promise<void> {
        await this.clearLoginMemoState();
        await this.clearLoginState();
    }
    public async removeLoginCookie(): Promise<void> {
        const cookie = GlobalVar.context.globalState.get<string>(STATE_COOKIE);
        const loginCookieNames = GlobalVar.context.globalState.get<string[]>(
            STATE_LOGIN_COOKIE_NAME
        );
        if (cookie && loginCookieNames) {
            await GlobalVar.context.globalState.update(
                STATE_COOKIE,
                removeCookie(cookie, loginCookieNames)
            );
        }
        await GlobalVar.context.globalState.update(
            STATE_LOGIN_COOKIE_NAME,
            undefined
        );
    }
    public get currentInstance(): MCSInstance {
        const instance = GlobalVar.currentInstance;
        if (!instance) {
            throw logger.terror({
                message: "require select instance",
                errorGetter: vscode.FileSystemError.NoPermissions,
            });
        }
        return instance;
    }
}
