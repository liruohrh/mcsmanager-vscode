import { AxiosError, AxiosResponse } from "axios";

export interface ServiceConfig {
    readonly urlPrefix: string;
    readonly apiKey: string;
    readonly pageSize: number;
    readonly autoLogin: boolean;
    readonly username: string;
    readonly password: string;
}

// api

export interface APIResp<T> {
    base: BaseResp<T>;
    error?: AxiosError;
    response?: AxiosResponse;
    status: number;
}
export interface BaseResp<T> {
    code: number;
    data?: T;
    message?: string;
}

// mcs

export interface MCSLoginUser {
    uuid: string;
    userName: string;
    loginTime: string;
    registerTime: string;
    instances: MCSInstance[];
    permission: number;
    apiKey: string;
    isInit: boolean;
    open2FA: boolean;
    secret: string;
    token: string;
}

export interface MCSInstance {
    hostIp: string;
    remarks: string;
    instanceUuid: string;
    daemonId: string;
    status: number;
    nickname: string;
    ie: string;
    oe: string;
    endTime: any;
    lastDatetime: number;
    stopCommand: string;
    processType: string;
    docker: MCSDocker;
    info: MCSInstanceInfo;
}

export interface MCSDocker {
    containerName: string;
    image: string;
    ports: any[];
    extraVolumes: any[];
    memory: number;
    networkMode: string;
    networkAliases: any[];
    cpusetCpus: string;
    cpuUsage: number;
    maxSpace: number;
    io: number;
    network: number;
    workingDir: string;
    env: any[];
}

export interface MCSInstanceInfo {
    mcPingOnline: boolean;
    currentPlayers: number;
    maxPlayers: number;
    version: string;
    fileLock: number;
    playersChart: any[];
    openFrpStatus: boolean;
    latency: number;
}
