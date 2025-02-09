import { AxiosError, AxiosResponse } from "axios";

export interface ServiceConfig {
    readonly urlPrefix: string;
    readonly apiKey: string;
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

export interface PageResp<T> {
    data?: T[];
    page?: number;
    pageSize?: number;
    total?: number;
}

export interface MCSPageResp<T> {
    items: T[];
    page: number;
    pageSize: number;
    total: number;
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

export interface MCSFileItem {
    name: string;
    path: string; // 文件的完整路径
    size: number;
    time: string;
    mode: number;
    type: number; // 0: directory, 1: file
}

export interface MCSFileListPageResp extends MCSPageResp<MCSFileItem> {
    absolutePath: string;
}

export interface MCSFileListReq {
    daemonId: string;
    uuid: string;
    page?: number;
    pageSize?: number;
    target: string;
    fileName?: string;
}

export interface MCSFileConfig {
    password: string;
    addr: string;
}
