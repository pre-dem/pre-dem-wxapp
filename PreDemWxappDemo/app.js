//app.js
const dem = require('./utils/pre-dem-wxapp.js')

App({
  onLaunch: function () {
    wx.login({
      success: res => {
        if (res.code) {
          let data = {
            appid: '此处填写您的在微信小程序后台获取到的 app id',
            secret: '此处填写您的在微信小程序后台获取到的 app secret',
            js_code: res.code,
            grant_type: 'authorization_code'
          }
          wx.request({
            url: 'https://api.weixin.qq.com/sns/jscode2session',
            data,
            success: res => {
              res.openid && dem.setOpenId(res.openid)
            }
          })
        }
      }
    })
    wx.getUserInfo({
      withCredentials: true,
      lang: '',
      success: function(res) {},
      fail: function(res) {},
      complete: function(res) {},
    })
  },
  onError: function(err) {
    console.log('test app handle error')
  }
})