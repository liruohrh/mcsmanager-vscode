# v0.2.2 --- 2025/7/20

## Fixs

1. fetch响应处理有问题，不能多次读取响应
2. 必须引入node-fetch才能用fetch
3. http时返回的是arraybuffer导致加载文件出错



# v0.2.1 --- 2025/7/16

- 修复fetch的响应处理没有正确考虑到mcs响应结构的问题



# v0.2.0 --- 2025/7/2

- 添加axios-fetch、axios-http、fetch网络库选项以及是否校验SSL选项来排查 [#1](https://github.com/liruohrh/mcsmanager-vscode/issues/1) 网络问题

# v0.1.3 --- 2025/5/23

-   更新 CHANGELOG

# v0.1.2 --- 2025/5/23

## Features

1. 更新配置时自动重新登录

## Fixs

1. 终端的 websocket url 响应的 addr 可能不仅仅是 host，可能有前缀 ws://、wss://

# v0.1.1 -- 2025/4/28

-   添加实例操作，支持打开终端、运行实例、停止实例、重启实例。
