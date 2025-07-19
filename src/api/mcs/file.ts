import { request } from "./conf";
import fs from "fs";
import path from "path";
import FormData from "form-data";
import { Config } from "@/utils/config";
import {
    APIResp,
    MCSLoginUser,
    MCSFileListPageResp,
    MCSFileListReq,
    MCSFileConfig
} from "@/types";

export async function copyFile({
    daemonId,
    uuid,
    targets
}: {
    daemonId: string;
    uuid: string;
    targets: string[][];
}): Promise<APIResp<boolean>> {
    return request('post', `/api/files/copy`, {
        params: {
            daemonId,
            uuid
        },
        headers: {
            "Content-Type": "application/json; charset=utf-8"
        },
        data: {
            targets
        }
    });
}

export async function moveFile({
    daemonId,
    uuid,
    targets
}: {
    daemonId: string;
    uuid: string;
    targets: string[][];
}): Promise<APIResp<boolean>> {
    return request('put', `/api/files/move`, {
        params: {
            daemonId,
            uuid
        },
        headers: {
            "Content-Type": "application/json; charset=utf-8"
        },
        data: {
            targets
        }
    });
}

export async function downloadFile({
    password,
    addr,
    downloadFilename
}: MCSFileConfig & { downloadFilename: string }): Promise<APIResp<Uint8Array>> {
    return request('get', `/download/${password}/${downloadFilename}`, {
        baseURL: `${
            Config.urlPrefix.startsWith("https") ? "https" : "http"
        }://${addr}/`,
        responseType: "arraybuffer"
    });
}

export async function uploadFile({
    password,
    addr,
    file,
    filepath
}: MCSFileConfig & {
    file?: fs.ReadStream | Uint8Array;
    filepath: string;
}): Promise<APIResp<string>> {
    const formData = new FormData();
    let options;
    if (file) {
        options = {
            filename: path.posix.basename(filepath)
        };
    } else {
        file = fs.createReadStream(filepath);
    }
    formData.append("file", file, options);
    return request('post', `/upload/${password}`, {
        baseURL: `${
            Config.urlPrefix.startsWith("https") ? "https" : "http"
        }://${addr}/`,
        headers: formData.getHeaders(),
        data: formData
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
    uploadDir
}: {
    daemonId: string;
    uuid: string;
    fileName?: string;
    uploadDir?: string;
}): Promise<APIResp<MCSFileConfig>> {
    let lastPath = fileName ? "download" : "upload";
    let paramName = fileName ? "file_name" : "upload_dir";
    return request('post', `/api/files/${lastPath}`, {
        params: {
            daemonId,
            uuid,
            [paramName]: fileName || uploadDir
        }
    });
}

export async function createDir({
    daemonId,
    uuid,
    target
}: {
    daemonId: string;
    uuid: string;
    target: string;
}): Promise<APIResp<boolean>> {
    return request('post', `/api/files/mkdir`, {
        params: {
            daemonId,
            uuid
        },
        headers: {
            "Content-Type": "application/json; charset=utf-8"
        },
        data: {
            target
        }
    });
}

export async function createFile({
    daemonId,
    uuid,
    target
}: {
    daemonId: string;
    uuid: string;
    target: string;
}): Promise<APIResp<boolean>> {
    return request('post', `/api/files/touch`, {
        params: {
            daemonId,
            uuid
        },
        headers: {
            "Content-Type": "application/json; charset=utf-8"
        },
        data: {
            target
        }
    });
}

export async function deleteFiles({
    daemonId,
    uuid,
    targets
}: {
    daemonId: string;
    uuid: string;
    targets: string[];
}): Promise<APIResp<boolean>> {
    return request('delete', `/api/files`, {
        params: {
            daemonId,
            uuid
        },
        headers: {
            "Content-Type": "application/json; charset=utf-8"
        },
        data: {
            targets
        }
    });
}

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
    return request('put', `/api/files`, {
        params: {
            daemonId,
            uuid
        },
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "x-requested-with": "XMLHttpRequest"
        },
        data: {
            target,
            text
        }
    });
}

export async function getFileContent({
    daemonId,
    uuid,
    target
}: {
    daemonId: string;
    uuid: string;
    target: string;
}): Promise<APIResp<string | boolean>> {
    return request('put', `/api/files`, {
        params: {
            daemonId,
            uuid
        },
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "x-requested-with": "XMLHttpRequest"
        },
        data: {
            target
        }
    });
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
    return request('get', `/api/files/list`, {
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
