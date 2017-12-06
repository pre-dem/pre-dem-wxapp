const conf = require('pre-dem-wxapp-conf')
var _openId, _domain, _appId, _appVersion

const
  MoniProgramType = 'WeChat',
  SdkVersion = '1.0.0',
  AppKeyLength = 24,
  AppIdLength = 8,
  UploadInterval = 10 * 1000 // 10 秒

const
  CustomEventApi = 'custom-events',
  HttpEventApi = 'http-monitors',
  LogEventApi = 'log-capture'

const
  UuidStorageKey = 'predem_uuid',
  CustomEventStorageKey = 'predem_custom_event',
  HttpEventStorageKey = 'predem_http_event',
  LogEventStorageKey = 'predem_log_event'

const
  CustomEventType = 'custom',
  AutoCapturedEventType = 'auto_captured'

const
  AppInfoEventName = 'app',
  CrashReportEventName = 'crash',
  HttpMonitorEventName = 'monitor',
  LogCaptureEventName = 'log'

const OriginMethodPrefix = '_origin_'

const request = requestObject => {
  var content = {
    start_timestamp: Date.now(),
  }
  if (requestObject) {
    if (requestObject.method) {
      content.method = requestObject.method
    } else {
      content.method = 'GET'
    }
    if (requestObject.url) {
      let domainAndPath = parseUrl(requestObject.url)
      domainAndPath && domainAndPath.domain && (content.domain = domainAndPath.domain)
      domainAndPath && domainAndPath.path && (content.path = domainAndPath.path)
    }
  }

  var newRequestObject = Object.assign({}, requestObject)
  injectFunction(newRequestObject, 'success', ret => {
    content.end_timestamp = Date.now()
    content.status_code = ret.statusCode
    ret.data && (content.data_length = JSON.stringify(ret.data).length)
    persistHttpEvent(content)
  })

  injectFunction(newRequestObject, 'fail', ret => {
    content.end_timestamp = Date.now()
    content.network_error_msg = ret.errMsg
    persistHttpEvent(content)
  })

  wx.request(newRequestObject)
}

const captureCustomEvent = (eventName, eventData) => {
  persistCustomEvent(eventName, eventData)
}

const startCaptureLog = () => {
  const levels = ['debug', 'info', 'warn', 'error', 'log']

  for (const level of levels) {
    injectFunction(console, level, (...args) => {
      persistLogEvent({
        level,
        message: args[0]
      })
    })
  }
}

const startSendReport = () => {
  sendCustomEvents()
  sendHttpEvents()
  sendLogEvents()
}

const persistCustomEvent = (eventName, content) => {
  var event = generateMetadata()
  event.type = CustomEventType
  event.name = eventName
  content && (event.content = JSON.stringify(content))
  persistEvent(CustomEventStorageKey, event)
}

const persistHttpEvent = content => {
  var event = generateMetadata()
  event.type = AutoCapturedEventType
  event.name = HttpMonitorEventName
  content && (event.content = JSON.stringify(content))
  persistEvent(HttpEventStorageKey, event)
}

const persistLogEvent = content => {
  var event = generateMetadata()
  event.type = AutoCapturedEventType
  event.name = LogCaptureEventName
  content && (event.content = JSON.stringify(content))
  persistEvent(LogEventStorageKey, event)
}

const persistEvent = (key, event) => {
  wx.getStorage({
    key,
    success: (ret) => {
      let events = ret.data
      events.push(JSON.stringify(event))
      wx.setStorage({
        key,
        data: events,
      })
    },
    fail: () => {
      let events = [JSON.stringify(event)]
      wx.setStorage({
        key,
        data: events,
      })
    },
  })
}

const sendCustomEvents = () => {
  wx.getStorage({
    key: CustomEventStorageKey,
    success: function (ret) {
      sendEvents(CustomEventApi, ret.data, () => {
        wx.removeStorage({
          key: CustomEventStorageKey,
        })
      })
    },
  })
}

const sendHttpEvents = () => {
  wx.getStorage({
    key: HttpEventStorageKey,
    success: ret => {
      sendEvents(HttpEventApi, ret.data, () => {
        wx.removeStorage({
          key: HttpEventStorageKey,
        })
      })
    },
  })
}

const sendLogEvents = () => {
  wx.getStorage({
    key: LogEventStorageKey,
    success: ret => {
      sendEvents(LogEventApi, ret.data, ret => {
        wx.removeStorage({
          key: LogEventStorageKey,
        })
      })
    },
  })
}

const sendEvents = (subPath, events, success) => {
  let data = events.join('\n')
  log('log', subPath + data)
  wx.request({
    url: _domain + '/v2/' + _appId + '/' + subPath,
    data,
    method: 'POST',
    success: ret => {
      if (ret.statusCode >= 200 && ret.statusCode < 300) {
        success(ret)
      }
    }
  })
}

const generateUuid = () => {
  const uuid = wx.getStorageSync(UuidStorageKey) || "" + Date.now() + Math.floor(1e7 * Math.random())
  wx.setStorageSync(UuidStorageKey, uuid)
  return uuid
}

const parseUrl = url => {
  var domain = "";
  var path = "";
  const array1 = url.split("//");
  var hostAndPath
  if (array1.length === 1) {
    hostAndPath = array1[0]
  } else {
    hostAndPath = array1[1]
  }
  let slashIndex = hostAndPath.indexOf('/')
  if (slashIndex == -1) {
    domain = hostAndPath
  } else {
    domain = hostAndPath.substring(0, slashIndex)
    path = hostAndPath.substring(slashIndex, hostAndPath.length)
  }
  return { domain, path }
}


function injectFunction(obj, methodName, func) {
  if (obj[methodName]) {
    obj[OriginMethodPrefix + methodName] = obj[methodName]
    obj[methodName] = (...params) => {
      func.call(this, params, methodName)
      obj[OriginMethodPrefix + methodName].call(this, ...params)
    }
  } else obj[methodName] = (...params) => {
    func.call(this, ...params, methodName)
  }
}

const generateMetadata = () => {
  const systemInfo = wx.getSystemInfoSync()
  const pages = getCurrentPages()
  var ret = {
    time: Date.now(),
    sdk_version: SdkVersion,
    sdk_id: generateUuid(),
    device_model: systemInfo.model,
    mini_program_type: MoniProgramType,
    mini_program_version: systemInfo.version,
    mini_program_sdk_version: systemInfo.SDKVersion
  }
  _appVersion && (ret.app_version = _appVersion)
  _openId && (ret.tag = _openId)
  if (pages.length != 0) {
    let route = pages[pages.length - 1].route
    route && (ret.path = route)
  }
  return ret
}

const log = (level, ...args) => {
  console[OriginMethodPrefix + level](args)
}

const setOpenId = openId => {
  _openId = openId || ''  
}

module.exports = {
  setOpenId,
  captureCustomEvent,
  request,
}

!function() {
  if (conf.appKey.length !== AppKeyLength) {
    console.error('清正确设置 appKey，长度为 ' + AppKeyLength)
    return
  }
  if (conf.domain.length == 0) {
    console.error('清正确设置 domain，不能为空')
    return
  }
  _domain = conf.domain
  _appId = conf.appKey.substring(0, AppIdLength)
  _appVersion = conf.appVersion || ''
  startCaptureLog()
  setInterval(startSendReport, UploadInterval)
}()