# pre-dem-cocoa

[![Build Status](https://travis-ci.org/pre-dem/pre-dem-wxapp.svg?branch=ci)](https://travis-ci.org/pre-dem/pre-dem-wxapp)

## 简介

pre-dem-wxapp 是由[七牛云](https://www.qiniu.com)发起和维护的针对微信小程序的集用户体验监控及报障于一体的开源 SDK，具有无埋点集成，轻量级，高性能等优点

## 功能清单

| 功能 | 版本 |
| - | - |
| error 监控 | v1.0.0 |
| HTTP 性能监控 | v1.0.0 |
| 自定义事件上报 | v1.0.0 |
| log 上报 | v1.0.0 |

## 快速开始

- 准备工作

参照 [Docs](https://pre-dem.github.io/docs) 注册 predem 的 app，生成上报 `domain` 及 `appKey`

- 配置域名

登录 [微信小程序管理后台](https://mp.weixin.qq.com) 在服务器域名配置当中添加上述生成的 `domain`

- 集成 sdk 代码

将工程下载到本地，找到 `PreDemWxappDemo/utils` 目录，将其中的 `pre-dem-wxapp-conf.js` 和 `pre-dem-wxapp.js` 拷贝到您的微信小程序工程中 `utils` 目录下

- 配置 config

修改 `pre-dem-wxapp-conf.js`，按照您 app 的实际情况配置 `domain`、`appKey` 及 `version`

- 引入代码

使用编辑器打开 `app.js` 文件，在文件顶部添加如下代码：
```
const dem = require('./utils/pre-dem-wxapp.js')
```

至此，您已经完成了基本的配置，下面可以运行您的小程序，很快，您就可以在 predem 的后台看到上报的数据了

## 高级功能
- 设置 `OpenId`
我们的 sdk 不会主动获取用户的 `OpenId` 信息，如果您需要在我们的平台使用 `OpenId` 进行用户数据的检索与分析，请在获取用户授权之后使用我们提供的接口设置 `OpenId`
```

```
