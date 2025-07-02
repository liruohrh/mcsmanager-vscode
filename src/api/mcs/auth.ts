import { request } from "./conf";
import { APIResp, MCSLoginUser } from "@/types";

export async function getLoginUser(): Promise<APIResp<MCSLoginUser>> {
    return request('get', `/api/auth`, {
        params: {
            advanced: true
        },
        headers: {
            // /auth/token、/auth/、非apiKey认证且需要token的接口需要
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
    return request('post', `/api/auth/login`, {
        data: {
            username,
            password
        }
    });
}

export async function logout({
    token
}: {
    token: string;
}): Promise<APIResp<boolean>> {
    return request('get', `/api/auth/logout`, {
        params: {
            token: token
        }
    });
}
