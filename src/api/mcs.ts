import { Config } from "../utils/config";
import { GlobalVar } from "../utils/global";
import {
    APIResp,
    MCSLoginUser,
    MCSFileListPageResp,
    MCSFileListReq
} from "../types";
import axiosG from "axios";
import { STATE_COOKIE } from "../utils/constant";

export async function updateFileContent({
    daemonId,
    uuid,
    target,
    text
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
            text
        },
        {
            params: {
                daemonId,
                uuid
            },
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "x-requested-with": "XMLHttpRequest"
            }
        }
    );
}

export async function getFileContent({
    daemonId,
    uuid,
    target
}: {
    daemonId: string;
    uuid: string;
    target: string;
}): Promise<APIResp<string>> {
    return axios.put(
        `/api/files`,
        {
            target
        },
        {
            params: {
                daemonId,
                uuid
            },
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "x-requested-with": "XMLHttpRequest"
            }
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
    fileName = ""
}: MCSFileListReq): Promise<APIResp<MCSFileListPageResp>> {
    return axios.get(`/api/files/list`, {
        params: {
            daemonId,
            uuid,
            page,
            page_size: pageSize,
            target,
            file_name: fileName
        },
        headers: {
            "x-requested-with": "XMLHttpRequest"
        }
    });
}

export async function getUserInfo(): Promise<APIResp<MCSLoginUser>> {
    return axios.get(`/api/auth/?advanced=true`, {
        headers: {
            "x-requested-with": "XMLHttpRequest"
        }
    });
}

export async function login({
    username,
    password
}: {
    username: string;
    password: string;
}): Promise<APIResp<string>> {
    return axios.post(`/api/auth/login`, {
        username,
        password
    });
}

export async function logout({
    token
}: {
    token: string;
}): Promise<APIResp<boolean>> {
    return axios.get(`/api/auth/logout`, {
        params: {
            token: token
        }
    });
}

const axios = axiosG.create();
export const axiosMcs = axios;
axios.defaults.validateStatus = (_) => true;
const withApiKeyPaths = ["/api/files"];
axios.interceptors.request.use((request) => {
    request.baseURL = Config.urlPrefix;
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
        const mcsResp = response.data;
        if (mcsResp.status !== 200) {
            //@ts-ignore
            response.base = {
                code: mcsResp.status,
                message: mcsResp.data
            };
        } else {
            //@ts-ignore
            response.base = {
                code: 0,
                data: mcsResp.data
            };
        }
        //@ts-ignore
        response.response = response;
        return response;
    },
    (error) => {
        if (!error.message && !error.response) {
            //client error
            return {
                base: {
                    code: -1,
                    message: `client error ${error.code}`
                },
                error: error
            };
        } else if (error.message && !error.response) {
            return {
                base: {
                    code: -1,
                    message: error.message
                },
                error: error
            };
        } else {
            const body = error.response.data;
            if (body && body.status) {
                return {
                    base: {
                        code: body.status,
                        message: JSON.stringify(body)
                    },
                    error: error,
                    status: error.response.status
                };
            }
            return {
                base: {
                    code: -1,
                    message: `${error.code} ${body}`
                },
                error: error,
                status: error.response.status
            };
        }
    }
);
