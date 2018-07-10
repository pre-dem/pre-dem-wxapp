//app.js

App({
  dem: require('./utils/pre-dem-wxapp.js'),
  onLaunch: () => {
    wx.login({
      success: res => {
        if (res.code) {
          wx.request({
            url: '此处填写您的获取OpenId的服务地址',
            data: res.code,
            success: res => {
              res.openid && dem.setOpenId(res.openid)
            }
          })
        }
      }
    })
  },
  onError: err => {
    console.log('test app handle error')
  },
  onShow: obj => {
    console.log(obj)
  }
})