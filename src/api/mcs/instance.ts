import { APIResp } from "@/types";
import { request } from "./conf";

export async function restartInstance({
    daemonId,
    uuid,
}: {
    daemonId: string;
    uuid: string;
}): Promise<APIResp<{ instanceUuid: string }>> {
    return request('post', `/api/protected_instance/restart`, {
        params: {
            daemonId,
            uuid,
        },
    });
}

export async function stopInstance({
    daemonId,
    uuid,
}: {
    daemonId: string;
    uuid: string;
}): Promise<APIResp<{ instanceUuid: string }>> {
    return request('post', `/api/protected_instance/stop`, {
        params: {
            daemonId,
            uuid,
        },
    });
}

export async function openInstance({
    daemonId,
    uuid,
}: {
    daemonId: string;
    uuid: string;
}): Promise<APIResp<{ instanceUuid: string }>> {
    return request('post', `/api/protected_instance/open`, {
        params: {
            daemonId,
            uuid,
        },
    });
}

export async function fetchInstanceTerminalText({
    daemonId,
    uuid,
    size,
}: {
    daemonId: string;
    uuid: string;
    size?: number;
}): Promise<APIResp<string>> {
    return request('get', `/api/protected_instance/outputlog`, {
        params: {
            daemonId,
            uuid,
            size,
        },
    });
}

export async function setUpTerminalStreamChannel({
    daemonId,
    uuid,
}: {
    daemonId: string;
    uuid: string;
}): Promise<APIResp<{ password: string; addr: string; prefix: string }>> {
    return request('post', `/api/protected_instance/stream_channel`, {
        params: {
            daemonId,
            uuid,
        },
    });
}
