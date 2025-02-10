import fs from "fs";
import path from "path";
import * as vscode from "vscode";
import FormData from "form-data";
import axiosG from "axios";
import { Config } from "@/utils/config";
import { GlobalVar } from "@/utils/global";
import {
    APIResp,
    MCSLoginUser,
    MCSFileListPageResp,
    MCSFileListReq,
    MCSFileConfig,
} from "@/types";
import { STATE_COOKIE } from "@/utils/constant";

export async function moveFile({
    daemonId,
    uuid,
    targets,
}: {
    daemonId: string;
    uuid: string;
    targets: string[][];
}): Promise<APIResp<boolean>> {
    return axios.put(
        `/api/files/move`,
        {
            targets,
        },
        {
            params: {
                daemonId,
                uuid,
            },
            headers: {
                "Content-Type": "application/json; charset=utf-8",
            },
        }
    );
}

export async function downloadFile({
    password,
    addr,
    downloadFilename,
}: MCSFileConfig & { downloadFilename: string }): Promise<APIResp<Uint8Array>> {
    return axios.get(`/download/${password}/${downloadFilename}`, {
        baseURL: `${
            Config.urlPrefix.startsWith("https") ? "https" : "http"
        }://${addr}/`,
        responseType: "arraybuffer",
    });
}
export async function uploadFile({
    password,
    addr,
    file,
    filepath,
}: MCSFileConfig & {
    file?: fs.ReadStream | Uint8Array;
    filepath: string;
}): Promise<APIResp<string>> {
    const formData = new FormData();
    let options;
    if (file) {
        options = {
            filename: path.posix.basename(filepath),
        };
    } else {
        file = fs.createReadStream(filepath);
    }
    formData.append("file", file, options);
    return axios.post(`/upload/${password}`, formData, {
        baseURL: `${
            Config.urlPrefix.startsWith("https") ? "https" : "http"
        }://${addr}/`,
        headers: {
            ...formData.getHeaders(),
            "Content-Type": "multipart/form-data",
        },
    });
}

/**
 *
 * @param fileName  获取下载配置
 * @param uploadDir  获取上传配置
 * @returns
 */
export async function getFileConfig({
    daemonId,
    uuid,
    fileName,
    uploadDir,
}: {
    daemonId: string;
    uuid: string;
    fileName?: string;
    uploadDir?: string;
}): Promise<APIResp<MCSFileConfig>> {
    let lastPath = fileName ? "download" : "upload";
    let paramName = fileName ? "file_name" : "upload_dir";
    return axios.post(`/api/files/${lastPath}`, null, {
        params: {
            daemonId,
            uuid,
            [paramName]: fileName || uploadDir,
        },
    });
}

export async function createDir({
    daemonId,
    uuid,
    target,
}: {
    daemonId: string;
    uuid: string;
    target: string;
}): Promise<APIResp<boolean>> {
    return axios.post(
        `/api/files/mkdir`,
        {
            target,
        },
        {
            params: {
                daemonId,
                uuid,
            },
            headers: {
                "Content-Type": "application/json; charset=utf-8",
            },
        }
    );
}

export async function createFile({
    daemonId,
    uuid,
    target,
}: {
    daemonId: string;
    uuid: string;
    target: string;
}): Promise<APIResp<boolean>> {
    return axios.post(
        `/api/files/touch`,
        {
            target,
        },
        {
            params: {
                daemonId,
                uuid,
            },
            headers: {
                "Content-Type": "application/json; charset=utf-8",
            },
        }
    );
}

export async function deleteFiles({
    daemonId,
    uuid,
    targets,
}: {
    daemonId: string;
    uuid: string;
    targets: string[];
}): Promise<APIResp<boolean>> {
    return axios.delete(`/api/files`, {
        data: {
            targets,
        },
        params: {
            daemonId,
            uuid,
        },
        headers: {
            "Content-Type": "application/json; charset=utf-8",
        },
    });
}

export async function updateFileContent({
    daemonId,
    uuid,
    target,
    text,
}: {
    daemonId: string;
    uuid: string;
    target: string;
    text: string;
}): Promise<APIResp<boolean>> {
    return axios.put(
        `/api/files`,
        {
            target,
            text,
        },
        {
            params: {
                daemonId,
                uuid,
            },
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "x-requested-with": "XMLHttpRequest",
            },
        }
    );
}

export async function getFileContent({
    daemonId,
    uuid,
    target,
}: {
    daemonId: string;
    uuid: string;
    target: string;
}): Promise<APIResp<string | boolean>> {
    return axios.put(
        `/api/files`,
        {
            target,
        },
        {
            params: {
                daemonId,
                uuid,
            },
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "x-requested-with": "XMLHttpRequest",
            },
        }
    );
}

export async function getFileList({
    daemonId,
    uuid,
    page = 0,
    // [最高100](https://github.com/MCSManager/MCSManager/blob/master/daemon/src/service/system_file.ts#L85)
    pageSize = 100,
    target,
    fileName = "",
}: MCSFileListReq): Promise<APIResp<MCSFileListPageResp>> {
    return axios.get(`/api/files/list`, {
        params: {
            daemonId,
            uuid,
            page,
            page_size: pageSize,
            target,
            file_name: fileName,
        },
        headers: {
            "x-requested-with": "XMLHttpRequest",
        },
    });
}

export async function getUserInfo(): Promise<APIResp<MCSLoginUser>> {
    return axios.get(`/api/auth/?advanced=true`, {
        headers: {
            "x-requested-with": "XMLHttpRequest",
        },
    });
}

export async function login({
    username,
    password,
}: {
    username: string;
    password: string;
}): Promise<APIResp<string>> {
    return axios.post(`/api/auth/login`, {
        username,
        password,
    });
}

export async function logout({
    token,
}: {
    token: string;
}): Promise<APIResp<boolean>> {
    return axios.get(`/api/auth/logout`, {
        params: {
            token: token,
        },
    });
}

const axios = axiosG.create();
export const axiosMcs = axios;
axios.defaults.validateStatus = (_) => true;
const withApiKeyPaths = ["/api/files"];
axios.interceptors.request.use((request) => {
    if (!request.baseURL) {
        request.baseURL = Config.urlPrefix;
    }
    const cookie = GlobalVar.context.globalState.get<string>(STATE_COOKIE);
    if (cookie) {
        request.headers["Cookie"] = cookie;
    }
    const apiKey = Config.apiKey;
    if (
        apiKey &&
        withApiKeyPaths.some((prefix) => request.url?.startsWith(prefix))
    ) {
        request.params.apikey = apiKey;
    }
    return request;
});
axios.interceptors.response.use(
    (response) => {
        const ct = response.headers["content-type"]?.toString();
        //mcs api 基本都响应text/plain，因此判断data是否是一个对象比较合适
        if (
            ct !== "application/octet-stream" &&
            (ct?.includes("json") || response.data instanceof Object)
        ) {
            const mcsResp = response.data;
            let code = mcsResp.status === 200 ? 0 : mcsResp.status;
            //@ts-ignore
            response.base = {
                code: code,
                data: code === 0 ? mcsResp.data : undefined,
                message: code !== 0 ? mcsResp.data : undefined,
            };
        } else {
            let code = response.status === 200 ? 0 : response.status;
            //@ts-ignore
            response.base = {
                code: code,
                data: code === 0 ? response.data : undefined,
                message: code !== 0 ? response.data : undefined,
            };
            //@ts-ignore
            response.ct = ct;
        }
        //@ts-ignore
        response.response = response;
        return response;
    },
    (error) => {
        if (!error.message && !error.response) {
            if (error.codes === "ECONNREFUSED") {
                vscode.window.showErrorMessage(
                    `服务器不在线 ${Config.urlPrefix}`
                );
            }
            //client error
            return {
                base: {
                    code: -1,
                    message: `client error ${error.code}`,
                },
                error: error,
            };
        } else if (error.message && !error.response) {
            return {
                base: {
                    code: -1,
                    message: error.message,
                },
                error: error,
            };
        } else {
            const body = error.response.data;
            if (body && body.status) {
                return {
                    base: {
                        code: body.status,
                        message: JSON.stringify(body),
                    },
                    error: error,
                    status: error.response.status,
                };
            }
            return {
                base: {
                    code: -1,
                    message: `${error.code} ${body}`,
                },
                error: error,
                status: error.response.status,
            };
        }
    }
);
