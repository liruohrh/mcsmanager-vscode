import { Config } from "@/utils/config";
import axiosG from "axios";
import * as vscode from "vscode";

const axios = axiosG.create();
export const axiosMcs = axios;
axios.defaults.validateStatus = (_) => true;
axios.interceptors.request.use((request) => {
    if (!request.baseURL) {
        request.baseURL = Config.urlPrefix;
    }
    //mcs apiKey
    //header=x-request-api-key  | queryKey=apiKey
    const apiKey = Config.apiKey;
    request.headers["x-request-api-key"] = apiKey;
    if (!request.params) {
        request.params = {};
    }
    request.params.apikey = apiKey;

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
                message: code !== 0 ? mcsResp.data : undefined
            };
        } else {
            let code = response.status === 200 ? 0 : response.status;
            //@ts-ignore
            response.base = {
                code: code,
                data: code === 0 ? response.data : undefined,
                message: code !== 0 ? response.data : undefined
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
                    `Server is down. ${Config.urlPrefix}`
                );
            }
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
