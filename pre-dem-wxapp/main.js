const conf = require('pre-dem-wxapp-conf')
var _openId, _domain, _appId, _appVersion
var
  _isSendingHttp = false,
  _isSendingLog = false,
  _isSendingCustom = false,
  _isSendingCrash = false,
  _isSendingTransaction = false,
  _isRetrievingAppConfig = false

var
  _localLogCaptureEnabled = true,
  _localCrashReportEnabled = true,
  _appConfig

const
  MoniProgramType = 'WeChat',
  SdkVersion = '1.0.0',
  AppKeyLength = 24,
  AppIdLength = 8,
  UploadInterval = 10 * 1000 // 10 秒

const
  CustomEventApi = 'custom-events',
  HttpEventApi = 'http-monitors',
  LogEventApi = 'log-capture',
  TransactionEventApi = 'transactions',
  CrashEventApi = 'crashes'

const
  UuidStorageKey = 'predem_uuid',
  CustomEventStorageKey = 'predem_custom_event',
  HttpEventStorageKey = 'predem_http_event',
  LogEventStorageKey = 'predem_log_event',
  CrashEventStorageKey = 'predem_crash_event',
  AppConfigStorageKey = 'predem_app_config',
  TransactionEventStorageKey = 'predem_transaction_event'

const
  CustomEventType = 'custom',
  AutoCapturedEventType = 'auto_captured'

const
  AppInfoEventName = 'app',
  CrashReportEventName = 'crash',
  HttpMonitorEventName = 'monitor',
  LogCaptureEventName = 'log',
  TransactionEventName = 'auto_captured_transaction'

const
  TransactionTypeCompleted = 0,
  TransactionTypeCancelled = 1,
  TransactionTypeFailed = 2

const OriginMethodPrefix = '_origin_'

const captureCustomEvent = (eventName, eventData) => {
  persistCustomEvent(eventName, eventData)
}

// 开始一个 transaction 并返回 transaction 的 handle 对象
const transactionStart = (transactionName) => {
  return {
    start_time: new Date().getTime(),
    transaction_name: transactionName,
    complete: () => {
      this.end_time = new Date().getTime()
      this.transaction_type = TransactionTypeCompleted
      persistTransactionEvent(this)
    },
    cancelWithReason: (reason) => {
      this.end_time = new Date().getTime()
      this.transaction_type = TransactionTypeCancelled
      this.reason = reason
      persistTransactionEvent(this)
    },
    failWithReason: (reason) => {
      this.end_time = new Date().getTime()
      this.transaction_type = TransactionTypeFailed
      this.reason = reason
      persistTransactionEvent(this)
    }
  }
}

// 发起一个请求，并采集数据，用于替换 wx.request 方法
const request = requestObject => {
  var content = {
    start_timestamp: Date.now(),
  }
  if (requestObject) {
    // 未指定 method 时即 GET
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
  // 注入代码收集 end_timestamp, status_code 等数据
  injectFunction(newRequestObject, 'success', ret => {
    content.end_timestamp = Date.now()
    content.status_code = ret.statusCode
    ret.data && (content.data_length = JSON.stringify(ret.data).length)
    persistHttpEvent(content)
  })

  // 注入代码收集 network_error_msg 等数据
  injectFunction(newRequestObject, 'fail', ret => {
    content.end_timestamp = Date.now()
    content.network_error_msg = ret.errMsg
    persistHttpEvent(content)
  })

  wx.request(newRequestObject)
}

const captureError = err => {
  err.stack && (err = err.stack)
  persistCrashEvent({
    crash_log_key: err
  })
}

// 开始采集 log
const startCaptureLog = () => {
  const levels = ['debug', 'info', 'warn', 'error', 'log']

  for (const level of levels) {
    // 注入代码到 console 的 debug, info 等方法，以采集相关的 log
    injectFunction(console, level, (...args) => {
      if (_localLogCaptureEnabled &&
        (_appConfig === undefined || _appConfig.log_capture_enabled)) {
        persistLogEvent({
          level,
          message: args[0]
        })
      }
    })
  }
}

const startSendReport = () => {
  sendCustomEvents()
  sendHttpEvents()
  sendLogEvents()
  sendCrashEvents()
  sendTransactionEvents()
  setTimeout(startSendReport, UploadInterval)
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

const persistCrashEvent = content => {
  var event = generateMetadata()
  event.type = AutoCapturedEventType
  event.name = CrashReportEventName
  content && (event.content = JSON.stringify(content))
  persistEvent(CrashEventStorageKey, event)
}

const persistTransactionEvent = content => {
  var event = generateMetadata()
  event.type = AutoCapturedEventType
  event.name = TransactionEventName
  content && (event.content = JSON.stringify(content))
  persistEvent(TransactionEventStorageKey, event)
}

// 存储事件到 storage 中
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
  if (_isSendingCustom) {
    return
  }
  _isSendingCustom = true
  wx.getStorage({
    key: CustomEventStorageKey,
    success: function (ret) {
      sendEvents(CustomEventApi, ret.data, () => {
        wx.removeStorage({
          key: CustomEventStorageKey,
        })
      })
    },
    complete: () => {
      _isSendingCustom = false
    }
  })
}

const sendHttpEvents = () => {
  if (_isSendingHttp) {
    return
  }
  _isSendingHttp = true
  wx.getStorage({
    key: HttpEventStorageKey,
    success: ret => {
      sendEvents(HttpEventApi, ret.data, () => {
        wx.removeStorage({
          key: HttpEventStorageKey,
        })
      })
    },
    complete: () => {
      _isSendingHttp = false
    }
  })
}

const sendTransactionEvents = () => {
  if (_isSendingTransaction) {
    return
  }
  _isSendingTransaction = true
  wx.getStorage({
    key: TransactionEventStorageKey,
    success: ret => {
      sendEvents(TransactionEventApi, ret.data, () => {
        wx.removeStorage({
          key: TransactionEventStorageKey,
        })
      })
    },
    complete: () => {
      _isSendingTransaction = false
    }
  })
}

const sendLogEvents = () => {
  if (_isSendingLog) {
    return
  }
  _isSendingLog = true
  wx.getStorage({
    key: LogEventStorageKey,
    success: ret => {
      sendEvents(LogEventApi, ret.data, ret => {
        wx.removeStorage({
          key: LogEventStorageKey,
        })
      })
    },
    complete: () => {
      _isSendingLog = false
    }
  })
}

const sendCrashEvents = () => {
  if (_isSendingCrash) {
    return
  }
  _isSendingCrash = true
  wx.getStorage({
    key: CrashEventStorageKey,
    success: ret => {
      sendEvents(CrashEventApi, ret.data, ret => {
        wx.removeStorage({
          key: CrashEventStorageKey,
        })
      })
    },
    complete: () => {
      _isSendingCrash = false
    }
  })
}

const sendEvents = (subPath, events, success, fail) => {
  let data = events.join('\n')
  wx.request({
    url: _domain + '/v2/' + _appId + '/' + subPath,
    data,
    method: 'POST',
    success: ret => {
      if (ret.statusCode >= 200 && ret.statusCode < 300) {
        success(ret)
      } else {
        fail(ret)
      }
    },
    fail
  })
}

const generateUuid = () => {
  let d = new Date().getTime();
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
  return uuid;
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

// 在 obj 中名称为 methodName 的方法中插入 func 的代码
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

const setOpenId = openId => {
  _openId = openId || ''
}

const setLogCaptureEnable = enabled => {
  _localLogCaptureEnabled = enabled
}

const setCrashReportEnable = enabled => {
  _localCrashReportEnabled = enabled
}

module.exports = {
  setOpenId,
  captureCustomEvent,
  request,
  captureError,
  transactionStart
}

const registerHookToApp = () => {
  setTimeout(() => {
    let app = getApp()
    app.dem = module.exports
    var originOnError = app.onError
    let errorHandle = err => {
      if (_localCrashReportEnabled &&
        (_appConfig === undefined || _appConfig.crash_report_enabled)) {
        persistCrashEvent({
          crash_log_key: err
        })
      }
    }
    var onError = errorHandle

    if (originOnError) {
      onError = err => {
        originOnError(err)
        errorHandle(err)
      }
    }
    // 所有注册的 onShow 都会顺次执行，所以不需要再手动执行 origin 了
    App({
      onError,
      onShow: refreshAppConfig
    })
  }, 0)
}

const refreshAppConfig = () => {
  if (_isRetrievingAppConfig === true) {
    return
  }
  _isRetrievingAppConfig = true
  if (_appConfig === undefined) {
    wx.getStorage({
      key: AppConfigStorageKey,
      success: function (res) {
        if (res.data !== undefined &&
          res.data.time !== undefined &&
          res.data.log_capture_enabled !== undefined &&
          res.data.crash_report_enabled !== undefined) {
          if (new Date(Date.now).toLocaleDateString === new Date(res.data.time).toLocaleDateString) {
            _appConfig = res.data
            _isRetrievingAppConfig = false
          } else {
            refreshAppConfigFromRemote(ret => {
              _isRetrievingAppConfig = false
            })
          }
        } else {
          refreshAppConfigFromRemote(ret => {
            _isRetrievingAppConfig = false
          })
        }
      },
      fail: function () {
        refreshAppConfigFromRemote(ret => {
          _isRetrievingAppConfig = false
        })
      }
    })
  } else {
    if (new Date(Date.now).toLocaleDateString !== new Date(_appConfig.time).toLocaleDateString) {
      refreshAppConfigFromRemote(ret => {
        _isRetrievingAppConfig = false
      })
    } else {
      _isRetrievingAppConfig = false
    }
  }
}

const refreshAppConfigFromRemote = (complete) => {
  sendEvents('app-config', [JSON.stringify(generateMetadata())], ret => {
    if (ret.data) {
      if (ret.data.log_capture_enabled !== undefined &&
        ret.data.crash_report_enabled !== undefined) {
        _appConfig = ret.data
        _appConfig.time = Date.now()
        wx.setStorage({
          key: AppConfigStorageKey,
          data: _appConfig
        })
      }
    }
    complete(ret)
  }, complete)
}

!function () {
  if (conf.appKey.length !== AppKeyLength) {
    console.error('请正确设置 appKey，长度为 ' + AppKeyLength)
    return
  }
  if (conf.domain.length == 0) {
    console.error('请正确设置 domain，不能为空')
    return
  }
  _domain = conf.domain
  _appId = conf.appKey.substring(0, AppIdLength)
  _appVersion = conf.appVersion || ''
  startCaptureLog()
  registerHookToApp()
  refreshAppConfig()
  setTimeout(startSendReport, UploadInterval)
}()