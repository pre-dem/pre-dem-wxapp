//index.js
//获取应用实例
const app = getApp()

const isEven = num => {
  if (num === 0) {
    return true;
  }

  if (num === 1) {
    return false;
  }

  return isEven(Math.abs(num) - 2);
}

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
  },
  throwError: () => {
    throw new Error("这是一个错误，你抛出了异常！")
  },
  overfolwError: () => {
    isEven(100000)
  },
  funcNotFoundError: () => {
    try {
      window.a.b !== 2
    } catch (ex) {
      captureException(ex)
    }
  },
  tryCatchError: () => {
    try {
        window.a.b !== 2
      } catch (e) {
        app.dem.captureError(e);
      }
  }
})
