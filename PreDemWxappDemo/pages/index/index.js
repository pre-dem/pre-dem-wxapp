//index.js
//获取应用实例
const app = getApp()

Page({
  data: {},
  sendCustomEvent: function() {
    app.dem.captureCustomEvent('testEvent', {
      test1: 1,
      test2: 2
    })
  },
  sendHttpRequest: function () {
    app.dem.request({
      url: 'https://www.baidu.com'
    })
  },
  logMessage: function () {
    console.log('test log', 'test arg')
  }
})
