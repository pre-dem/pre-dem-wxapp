const SdkVersion = '1.0.0'
const APP_KEY_LENGTH = 24
const APP_ID_LENGTH = 8

var _openId = '', _domain = '', _appId = '', _appVersion = ''

const generateMetadata = () => {
  const systemInfo = wx.getSystemInfoSync()
  return {
    time: Date.now(),
    app_version: _appVersion,
    sdk_version: SdkVersion,
    sdk_id: generateUuid(),
    tag: _openId,
    device_model: systemInfo.model,
    mini_program_type: 'WeChat',
    mini_program_version: systemInfo.version,
    mini_program_sdk_version: systemInfo.SDKVersion
  }
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

module.exports = {
  init,
  sendCustomEvent
}

setTimeout(()=> {
  console.info(generateMetadata())
  console.info(wx.getSystemInfoSync())
  // sendEvent('app-config', generateMetadata())
}, 100)

