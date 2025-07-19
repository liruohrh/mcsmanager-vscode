import { Config } from "@/utils/config";
import https from "https";
import fetch from "node-fetch";

export async function fetchMcs(url: string, options: RequestInit = {}) {
    // @ts-ignore
    return fetch(url, {
        ...options,
        agent: !url.startsWith("https")
            ? undefined
            : new https.Agent({ rejectUnauthorized: Config.sslVerify }),
    });
}
