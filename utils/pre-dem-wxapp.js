var _openId, _domain, _appId, _appVersion

const
  MoniProgramType = 'WeChat',
  SdkVersion = '1.0.0',
  AppKeyLength = 24,
  AppIdLength = 8,
  UploadInterval = 10

const
  UuidStorageKey = "predem_uuid",
  CustomEventStorageKey = "predem_custom_event",
  HttpEventStorageKey = "predem_http_event",
  LogEventStorageKey = "predem_log_event"

function injectFunction(obj, methodName, func) {
  if (obj[methodName]) {
    var tmp = obj[methodName];
    obj[methodName] = (...param) => {
      func.call(this, param, methodName)
      tmp.call(this, param)
    }
  } else obj[methodName] = param => {
    func.call(this, param, methodName)
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

const sendEvent = (subPath, event) => {
  wx.request({
    url: _domain + '/v2/' + _appId + '/' + subPath,
    data: event,
    method: 'POST'
  })
}

const sendCustomEvent = (customEvent) => {
  var event = generateMetadata()
  event.content = JSON.stringify(customEvent)
  sendEvent('custom-events', event)
}

const sendHttpEvent = (httpEvent) => {
  var event = generateMetadata()
  event.content = JSON.stringify(httpEvent)
  sendEvent('http-monitors', event)
}

const sendLog = (logEvent) => {
  var event = generateMetadata()
  event.content = JSON.stringify(logEvent)
  sendEvent('log-capture', event)
}

const generateUuid = () => {
  const uuid = wx.getStorageSync(UuidStorageKey) || "" + Date.now() + Math.floor(1e7 * Math.random())
  wx.setStorageSync(UuidStorageKey, uuid)
  return uuid
}

const init = (domain, appKey, appVersion, openId) => {
  if (appKey.length !== AppKeyLength) {
    console.error('清正确设置 appKey，长度为 ' + AppKeyLength)
    return
  }
  if (domain.length == 0) {
    console.error('清正确设置 domain，不能为空')
    return
  }
  _domain = domain
  _appId = appKey.substring(0, AppIdLength)
  _appVersion = appVersion || ''
  _openId = openId || ''
  startCaptureLog()
}

const request = (requestObject) => {
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
  injectFunction(newRequestObject, 'success', (ret) => {
    content.end_timestamp = Date.now()
    content.status_code = ret.statusCode
    content.data_length = JSON.stringify(ret.data).length
    sendHttpEvent(content)
  })

  injectFunction(newRequestObject, 'fail', (ret) => {
    content.end_timestamp = Date.now()
    content.network_error_msg = ret.errMsg
    sendHttpEvent(content)
  })

  wx.request(newRequestObject)
}

const parseUrl = (url) => {
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

function startCaptureLog() {
  const levels = ['debug', 'info', 'warn', 'error', 'log']

  for (const level of levels) {
    injectFunction(console, level, (...args) => {
      const tempArgs = [];
      args.map((arg) => {
        if (arg instanceof Object) {
          tempArgs.push(JSON.stringify(arg))
        } else {
          tempArgs.push(arg)
        }
      })
      const message = tempArgs.join(' ')
      sendLog({
        level,
        message
      })
    })
  }
}

const startReport = () => {
  setTimeout(startReport, UploadInterval)
}

module.exports = {
  init,
  sendCustomEvent,
  request,
}

setTimeout(() => {
  console.log("%s", "yesy")
}, 1000)

