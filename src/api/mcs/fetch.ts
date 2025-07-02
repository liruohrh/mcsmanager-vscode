import { Config } from "@/utils/config";
import https from "https";

export async function fetchMcs(url: string, options: RequestInit = {}) {
    // Only add agent if running in Node.js
    // @ts-ignore: agent is supported in node-fetch
    return fetch(url, { ...options, agent: new https.Agent({ rejectUnauthorized: Config.sslVerify }) });
}
