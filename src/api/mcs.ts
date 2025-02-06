import { Config } from "../utils/config";
import { GlobalVar } from "../utils/global";
import { APIResp, MCSLoginUser } from "../types";
import axiosG from "axios";
import { STATE_COOKIE } from "../utils/constant";

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
axios.interceptors.request.use((request) => {
    request.baseURL = Config.urlPrefix;
    const cookie = GlobalVar.context.globalState.get<string>(STATE_COOKIE);
    if (cookie) {
        request.headers["Cookie"] = cookie;
    }
    return request;
});
axios.interceptors.response.use(
    (response) => {
        const mcsResp = response.data;
        if (mcsResp.status !== 200) {
            //@ts-ignore
            response.base = {
                code: -1,
                message: `${mcsResp.status} ${mcsResp.data}`,
            };
        } else {
            //@ts-ignore
            response.base = {
                code: 0,
                data: mcsResp.data,
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
                        code: -1,
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
