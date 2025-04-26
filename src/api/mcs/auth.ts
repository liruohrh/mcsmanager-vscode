import { axiosMcs } from "./config";
import { APIResp, MCSLoginUser } from "@/types";

export async function getLoginUser(): Promise<APIResp<MCSLoginUser>> {
    return axiosMcs.get(`/api/auth`, {
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
    return axiosMcs.post(`/api/auth/login`, {
        username,
        password
    });
}

export async function logout({
    token
}: {
    token: string;
}): Promise<APIResp<boolean>> {
    return axiosMcs.get(`/api/auth/logout`, {
        params: {
            token: token
        }
    });
}
