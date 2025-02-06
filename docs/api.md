

### 通用
- 当响应4xx-5xx响应码，就是响应了一个错误，通常都会有一个JSON响应体，data属性表示错误信息

### 登录

#### 请求
```http
POST /api/auth/login HTTP/1.1
Host: {{配置的host}}
Content-Type: application/json
Content-Length: 77

{
    "username": "{{配置的username}}",
    "password": "{{配置的password}}",
    "code": ""
}
```

#### 响应
```json
{"status":200,"data":"3c078e2d624f43b2bc1bcc1eecedead11738657592713","time":1738657592715}
```

### 登出

#### 请求
```http
GET /api/auth/logout?token={{登录时响应的data}} HTTP/1.1
Host: {{配置的host}}
```

#### 响应
```json
{

    "status": 200,

    "data": true,

    "time": 1738658170302

}
```

## 获取登录用户信息

### 请求
```http
GET /api/auth/?advanced=true HTTP/1.1
Host: {{配置的host}}
Cookie: {{登录时响应的Cookie}}
x-requested-with: XMLHttpRequest
```


### 响应
```json
{

    "status": 200,

    "data": {

        "uuid": "4fd9080815054d1a8db1a4e949a060c6",

        "userName": "liruo",

        "loginTime": "2025/2/4 16:43:33",

        "registerTime": "2025/2/4 14:11:21",

        "instances": [

            {

                "hostIp": "localhost:24444",

                "remarks": "",

                "instanceUuid": "3f087419349247ff8417b08bd5f66554",

                "daemonId": "05c46b50483a4c76a454268c552f8790",

                "status": 3,

                "nickname": "本地服务器",

                "ie": "utf8",

                "oe": "utf8",

                "endTime": null,

                "lastDatetime": 1738649637319,

                "stopCommand": "stop",

                "processType": "general",

                "docker": {

                    "containerName": "",

                    "image": "",

                    "ports": [],

                    "extraVolumes": [],

                    "memory": 0,

                    "networkMode": "bridge",

                    "networkAliases": [],

                    "cpusetCpus": "",

                    "cpuUsage": 0,

                    "maxSpace": 0,

                    "io": 0,

                    "network": 0,

                    "workingDir": "/workspace/",

                    "env": []

                },

                "info": {

                    "mcPingOnline": true,

                    "currentPlayers": 0,

                    "maxPlayers": 20,

                    "version": "1.12.2",

                    "fileLock": 0,

                    "playersChart": [],

                    "openFrpStatus": false,

                    "latency": 3

                }

            }

        ],

        "permission": 1,

        "apiKey": "f2b9b0fa8c6d4c8787de62fa9ac74289",

        "isInit": false,

        "open2FA": false,

        "secret": "",

        "token": "947db6f453b24c1388b12b1ee3ae5c361738649547237"

    },

    "time": 1738658733732

}
```

## 实例文件管理
### 获取文件列表
#### 请求
```http
GET /api/files/list?apikey={{配置的apikey}}&daemonId={{选择的实例的daemonId}}&uuid={{选择的实例的的实例id}}&page={{分页参数当前页}}&page_size={{配置的page_size}}&target={{选择的目录}}&file_name={{file_name参数是一个空字符串，但是一定要有}} HTTP/1.1
Host: {{配置的host}}
```

#### 响应
```json
{

    "status": 200,

    "data": {

        "items": [

            {

                "name": "com",

                "size": 0,

                "time": "Tue Feb 04 2025 14:14:33 GMT+0800 (中国标准时间)",

                "mode": 666,

                "type": 0

            },

            {

                "name": "io",

                "size": 0,

                "time": "Mon Feb 03 2025 20:16:22 GMT+0800 (中国标准时间)",

                "mode": 666,

                "type": 0

            },

            {

                "name": "me",

                "size": 0,

                "time": "Tue Feb 04 2025 14:14:09 GMT+0800 (中国标准时间)",

                "mode": 666,

                "type": 0

            },

            {

                "name": "org",

                "size": 0,

                "time": "Tue Feb 04 2025 14:14:33 GMT+0800 (中国标准时间)",

                "mode": 666,

                "type": 0

            }

        ],

        "page": 0,

        "pageSize": 100,

        "total": 4,

        "absolutePath": "D:\\code\\work\\sakurarealm\\servers\\spigotmc-moreplugins\\libraries"

    },

    "time": 1738653087228

}
```



### 上传文件-1-获得上传配置
- 上传文件分2步
1. 获得上传配置
2. 上传文件
#### 请求
```http
POST /api/files/upload?apikey={{配置的apikey}}&daemonId={{选择的实例的daemonId}}&uuid={{选择的实例的的实例id}}&upload_dir={{上传到该目录下}} HTTP/1.1
Host: {{配置的host}}
```

#### 响应
```json
{
    "status": 200,
    "data": {
        "password": "4636bfd9485f440b819a8a776af468341738653853719",
        "addr": "localhost:24444"
    },
    "time": 1738653853722
}
```

### 上传文件-2-上传文件
#### 请求
```http
POST /upload/{{步骤1响应的password}}?apikey={{配置的apikey}} HTTP/1.1
Host: {{步骤1响应的addr}}
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Length: 223

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="file"; filename="{{上传的文件的文件名}}"
Content-Type: <Content-Type header here>

(data)
------WebKitFormBoundary7MA4YWxkTrZu0gW--

```

#### 响应
```text
OK
```


### 下载文件-1-获得下载配置
- 下载文件分2步
1. 获得下载配置
2. 下载文件
#### 请求
```http
POST /api/files/download?apikey={{配置的apikey}}&daemonId={{选择的实例的daemonId}}&uuid={{选择的实例的的实例id}}&file_name={{要下载的文件路径}} HTTP/1.1
Host: {{配置的host}}
```

#### 响应
```json
{

    "status": 200,

    "data": {

        "password": "2f674992534349c29f58aac740a299a01738655894789",

        "addr": "localhost:24444"

    },

    "time": 1738655894791

}
```

### 下载文件-2-下载文件
#### 请求
```http
GET /download/{{步骤1响应的password}}/{{步骤1请求的文件名}}/?apikey={{配置的apikey}} HTTP/1.1
Host: {{步骤1响应的addr}}
```

#### 响应
- Content-Type：application/octet-stream
- 响应体就是文件内容



### 获取文件内容
#### 请求
```http
PUT /api/files?apikey={{配置的apikey}}&daemonId={{选择的实例的daemonId}}&uuid={{选择的实例的的实例id}} HTTP/1.1
Host: {{配置的host}}
Content-Type: application/json; charset=utf-8
Content-Length: 29

{
  "target": "{{要获取内容的文件路径}}"
}
```

#### 响应
```json
{

    "status": 200,

    "data": "#By changing the setting below to TRUE you are indicating your agreement to our EULA (https://account.mojang.com/documents/minecraft_eula).\r\n#Sun Apr 07 21:38:07 CST 2024\r\neula=true\r\n",

    "time": 1738653312720

}
```

### 更新文件内容
#### 请求
```http
PUT /api/files?apikey={{配置的apikey}}&daemonId={{选择的实例的daemonId}}&uuid={{选择的实例的的实例id}} HTTP/1.1
Host: {{配置的host}}
Content-Type: application/json
Content-Length: 62

{
  "target": "{{要更新的文件路径}}",
  "text": "{{文件的新内容}}" 
}
```

#### 响应
```json
{

    "status": 200,

    "data": true,

    "time": 1738655057334

}
```

### 删除文件
- 支持删除目录
- 路径不存在仍然响应成功，即被忽视了

#### 请求
```http
DELETE /api/files?apikey={{配置的apikey}}&daemonId={{选择的实例的daemonId}}&uuid={{选择的实例的的实例id}} HTTP/1.1
Host: {{配置的host}}
Content-Type: application/json
Content-Length: 71

{
  "targets": [
    "{{要删除的文件路径}}"
  ]
}
```

#### 响应
```json
{

    "status": 200,

    "data": true,

    "time": 1738655262110

}
```

### 新建文件
- 如果文件路径存在，则被忽视
- 仅仅用于创建文件，文件内容是空的，即touch文件
#### 请求
```http
POST /api/files/mkdir?apikey={{配置的apikey}}&daemonId={{选择的实例的daemonId}}&uuid={{选择的实例的的实例id}} HTTP/1.1
Host: {{配置的host}}
Content-Type: application/json
Content-Length: 34

{
  "target": "{{创建的文件路径}}"
}
```

#### 响应
```json
{

    "status": 200,

    "data": true,

    "time": 1738655447131

}
```


### 新建目录
#### 请求
```http
POST /api/files/mkdir?apikey={{配置的apikey}}&daemonId={{选择的实例的daemonId}}&uuid={{选择的实例的的实例id}} HTTP/1.1
Host: {{配置的host}}
Content-Type: application/json
Content-Length: 25

{
  "target": "{{创建的文件路径}}"
}
```

#### 响应
```json
{

    "status": 200,

    "data": true,

    "time": 1738655447131

}
```


### 移动文件或者重命名文件

#### 请求
```http
PUT /api/files/move?apikey={{配置的apikey}}&daemonId={{选择的实例的daemonId}}&uuid={{选择的实例的的实例id}} HTTP/1.1
Host: {{配置的host}}
Content-Type: application/json
Content-Length: 179

{
  "targets": [
    [
      "{{文件路径}}", 
      "{{文件新路径}}"
    ]
  ]
}
```

#### 响应
```json
{

    "status": 200,

    "data": true,

    "time": 1738656265897

}
```

### 压缩文件
- type固定为2
- code固定为utf-8

- 压缩文件符合可视化逻辑，即
	- 文件必须都在一个目录下，不能是目录下的目录中的文件，即不能是嵌套文件
	- source表示压缩文件路径，该路径和要压缩的文件必须在同一个目录下

#### 请求
```http
POST /api/files/compress?apikey={{配置的apikey}}&daemonId={{选择的实例的daemonId}}&uuid={{选择的实例的的实例id}} HTTP/1.1
Host: {{配置的host}}
Content-Type: application/json
Content-Length: 119

{
  "type": 1,
  "code": "utf-8", 
  "source": "{{压缩文件路径}}", 
  "targets": [
    "{{要压缩的文件的路径}}"
  ]
}
```

#### 响应
```json
{"status":200,"data":true,"time":1738656797303}
```


### 解压文件
- type固定为2
- code固定为utf-8

#### 请求
```http
POST /api/files/compress?apikey={{配置的apikey}}&daemonId={{选择的实例的daemonId}}&uuid={{选择的实例的的实例id}} HTTP/1.1
Host: {{配置的host}}
Content-Type: application/json
Content-Length: 101

{
  "type": 2,
  "code": "utf-8", 
  "source": "{{压缩文件路径}}", 
  "targets": "{{解压缩路径}}"
}
```

#### 响应
```json
{

    "status": 200,

    "data": true,

    "time": 1738657232514

}
```
