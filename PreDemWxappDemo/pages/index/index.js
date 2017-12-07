//index.js
//获取应用实例
const app = getApp()

Page({
  data: {},
  sendCustomEvent: () => {
    app.dem.captureCustomEvent('testEvent', {
      test1: 1,
      test2: 2
    })
  },
  requestWeb: () => {
    let urls = ['https://www.qiniu.com', 'https://www.baidu.com']
    for (let index in urls) {
      app.dem.request({
        url: urls[index],
        complete: (ret) => {
          console.log(ret)
        }
      })
    }
  },
  send2xxRequest: () => {
    let codes = [200, 201, 203, 204]
    for (let index in codes) {
      app.dem.request({
        url: 'http://httpbin.org/status/' + codes[index],
        complete: (ret) => {
          console.log(ret)
        }
      })
    }
  }, 
  send4xxRequest: () => {
    let codes = [400, 401, 403, 404]
    for (let index in codes) {
      app.dem.request({
        url: 'http://httpbin.org/status/' + codes[index],
        complete: (ret) => {
          console.log(ret)
        }
      })
    }
  },
  send5xxRequest: () => {
    let codes = [500, 501, 503, 504]
    for (let index in codes) {
      app.dem.request({
        url: 'http://httpbin.org/status/' + codes[index],
        complete: (ret) => {
          console.log(ret)
        }
      })
    }
  },
  logMessage: () => {
    console.log('test log', 'test arg')
  }
})
