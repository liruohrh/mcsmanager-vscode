import { Config } from "@/utils/config";
import axiosG from "axios";
import https from "https";

const axios = axiosG.create({
    adapter: "fetch",
    httpsAgent: new https.Agent({ rejectUnauthorized: Config.sslVerify }),
});
export const axiosMcs = axios;
