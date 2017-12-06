//index.js
//获取应用实例
const app = getApp()
const predem = require('./../../utils/pre-dem-wxapp.js')

Page({
  data: {},
  sendCustomEvent: function() {
    predem.captureCustomEvent('testEvent', {
      test1: 1,
      test2: 2
    })
  },
  sendHttpRequest: function () {
    predem.request({
      url: 'https://www.baidu.com'
    })
  },
  logMessage: function () {
    console.log('test log', 'test arg')
  }
})
