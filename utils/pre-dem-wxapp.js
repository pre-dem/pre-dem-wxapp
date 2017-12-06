const SdkVersion = '1.0.0'
const APP_KEY_LENGTH = 24
const APP_ID_LENGTH = 8

var _openId = '', _domain = '', _appId = '', _appVersion = ''

const generateMetadata = () => {
  const systemInfo = wx.getSystemInfoSync()
  const pages = getCurrentPages()
  var ret = {
    time: Date.now(),
    sdk_version: SdkVersion,
    sdk_id: generateUuid(),
    device_model: systemInfo.model,
    mini_program_type: 'WeChat',
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

const generateUuid = () => {
  const uuid = wx.getStorageSync("predem_uuid") || "" + Date.now() + Math.floor(1e7 * Math.random())
  wx.setStorageSync("predem_uuid", uuid)
  return uuid
}

const init = (domain, appKey, appVersion, openId) => {
  if (appKey.length !== APP_KEY_LENGTH) {
    console.error('清正确设置 appKey，长度为 ' + APP_KEY_LENGTH)
    return
  }
  if (domain.length == 0) {
    console.error('清正确设置 domain，不能为空')
    return
  }
  _domain = domain
  _appId = appKey.substring(0, APP_ID_LENGTH)
  _appVersion = appVersion || ''
  _openId = openId || ''
}

const request = (requestObject) => {
  var content = {
    start_timestamp: Date.now(),
    method: requestObject.method,
  }
  let domainAndPath = parseUrl(requestObject.url)
  domainAndPath.domain && (content.domain = domainAndPath.domain)
  domainAndPath.path && (content.path = domainAndPath.path)

  var newRequestObject = Object.assign({}, requestObject)
  newRequestObject.success = (ret) => {
    content.end_timestamp = Date.now()
    content.status_code = ret.statusCode
    content.data_length = JSON.stringify(ret.data).length
    requestObject.success(ret)
    sendCustomEvent(content)
  }
  newRequestObject.fail = (ret) => {
    content.end_timestamp = Date.now()
    content.network_error_msg = ret.errMsg
    requestObject.fail(ret)
    sendCustomEvent(content)
  }
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

const debug = console.debug
console.debug = (obj) => {
  debug(obj)
}

const info = console.info
console.info = (obj) => {
  info(obj)
}

const warn = console.warn
console.warn = (obj) => {
  warn(obj)
}

const error = console.error
console.error = (obj) => {
  error(obj)
}

module.exports = {
  init,
  sendCustomEvent
}

setTimeout(() => {
  console.info(generateMetadata())
  console.info(wx.getSystemInfoSync())
  request({
    url: 'http://www.baidu.com',
    success: (ret) => {
      console.log(ret)
    }
  })
}, 1000)

