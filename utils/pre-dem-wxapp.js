const sdk_version = '1.0.0'
var _tag = ''

const generateMetadata = () => {
  return {
    sdk_version,
    sdk_id: generateUuid(),
    tag: _tag,
  }
}

const generateUuid = () => {
  const uuid = wx.getStorageSync("predem_uuid") || "" + Date.now() + Math.floor(1e7 * Math.random());
  wx.setStorageSync("predem_uuid", uuid)
  return uuid
}

const setTag = (tag) => {
  _tag = tag
}

console.info(generateMetadata())
