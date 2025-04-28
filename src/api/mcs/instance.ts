import { APIResp } from "@/types";
import { axiosMcs } from "./config";

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
