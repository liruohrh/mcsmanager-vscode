import { Config } from "@/utils/config";
import axios from "axios";
import { axiosMcs } from "./axios";
import { fetchMcs } from "./fetch";
import * as vscode from "vscode";
import { BaseResp } from "@/types";

export interface IOptions {
    reqBodyType?: "json" | "text" | "bytes";
}
export interface RequestOptions<B1 = any> extends IOptions {
    baseURL?: string;
    url?: string;
    method?: string;
    headers?: Record<string, any>;
    params?: Record<string, any>;
    data?: B1;
    responseType?: string;
    [key: string]: any;
}

function buildUrlWithParams(url: string, params?: Record<string, any>) {
    if (!params) {
        return url;
    }
    const usp = new URLSearchParams(params as any);
    return url + (url.includes("?") ? "&" : "?") + usp.toString();
}

function buildHeaders(headers: Record<string, any> = {}) {
    const apiKey = Config.apiKey;
    return {
        ...headers,
        "x-request-api-key": apiKey,
    };
}

export async function request<B1 = any, B2 = any>(
    method: string,
    url: string,
    options: RequestOptions<B1> = {}
): Promise<B2> {
    const baseURL = options.baseURL || Config.urlPrefix;
    const headers = buildHeaders(options.headers);
    const params = { ...options.params, apikey: Config.apiKey };
    const responseType = options.responseType;
    const data = options.data;
    if (Config.networkLibrary.startsWith("axios-")) {
        try {
            const resp = await axiosMcs.request({
                adapter: Config.networkLibrary.replace("axios-", ""),
                method,
                url,
                baseURL,
                headers,
                params,
                data,
                responseType: responseType as axios.ResponseType,
            });
            return handleResponse(resp) as B2;
        } catch (error) {
            return handleError(error) as B2;
        }
    } else {
        // fetch
        let fetchUrl = baseURL ? baseURL.replace(/\/$/, "") + url : url;
        if (params) {
            fetchUrl = buildUrlWithParams(fetchUrl, params);
        }
        const fetchOptions: RequestInit = {
            method: method.toUpperCase(),
            headers,
            body:
                ["POST", "PUT", "PATCH"].includes(method.toUpperCase()) && data
                    ? data instanceof FormData
                        ? data
                        : JSON.stringify(data)
                    : undefined,
        };
        try {
            const res = await fetchMcs(fetchUrl, fetchOptions);
            return (await handleFetchResponse(res)) as B2;
        } catch (error) {
            return handleError(error) as B2;
        }
    }
}

function handleResponse(resp: any) {
    const ct = resp.headers?.["content-type"]?.toString();
    if (
        ct !== "application/octet-stream" &&
        (ct?.includes("json") || resp.data instanceof Object)
    ) {
        const mcsResp = resp.data;
        let code = mcsResp.status === 200 ? 0 : mcsResp.status;
        return {
            base: {
                code: code,
                data: code === 0 ? mcsResp.data : undefined,
                message: code !== 0 ? mcsResp.data : undefined,
            },
            response: resp,
            status: resp.status,
        };
    } else {
        let code = resp.status === 200 ? 0 : resp.status;
        return {
            base: {
                code: code,
                data: code === 0 ? resp.data : undefined,
                message: code !== 0 ? resp.data : undefined,
            },
            response: resp,
            status: resp.status,
        };
    }
}

async function handleFetchResponse(res: Response) {
    const ct = res.headers.get("content-type") || "";
    let data: any;
    if (!ct || ct.includes("json")) {
        data = await res.json();
    } else if (ct.includes("text")) {
        data = await res.text();
    } else {
        data = await res.arrayBuffer();
    }
    let code = data && data.status === 200 ? 0 : data?.status ?? res.status;
    return {
        base: {
            code: code,
            data: code === 0 ? data?.data : undefined,
            message: code !== 0 ? data?.data : undefined,
        },
        response: res,
        status: res.status,
    };
}

function handleError(error: any) {
    if (!error.message && !error.response) {
        if (error.codes === "ECONNREFUSED") {
            vscode.window.showErrorMessage(
                `Server is down. ${Config.urlPrefix}`
            );
        }
        return {
            base: {
                code: -1,
                message: `client error ${error.code}`,
            },
            error: error,
        };
    } else if (error.message && !error.response) {
        //诸如超时、适配器错误
        return {
            base: {
                code: -1,
                message: error.message,
            },
            error: error,
        };
    } else {
        const body = error.response?.data;
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
            status: error.response?.status,
        };
    }
}
