import { APIResp } from "@/types";
import { axiosMcs } from "./config";

export async function restartInstance({
    daemonId,
    uuid,
}: {
    daemonId: string;
    uuid: string;
}): Promise<APIResp<{ instanceUuid: string }>> {
    return axiosMcs.post(`/api/protected_instance/restart`, null, {
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
    return axiosMcs.post(`/api/protected_instance/stop`, null, {
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
    return axiosMcs.post(`/api/protected_instance/open`, null, {
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
    return axiosMcs.get(`/api/protected_instance/outputlog`, {
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
    return axiosMcs.post(`/api/protected_instance/stream_channel`, undefined, {
        params: {
            daemonId,
            uuid,
        },
    });
}
