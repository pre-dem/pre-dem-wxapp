!function(e,t){if("object"==typeof exports&&"object"==typeof module)module.exports=t(require("./pre-dem-wxapp-conf.js"));else if("function"==typeof define&&define.amd)define(["./pre-dem-wxapp-conf.js"],t);else{var r=t("object"==typeof exports?require("./pre-dem-wxapp-conf.js"):e["./pre-dem-wxapp-conf.js"]);for(var o in r)("object"==typeof exports?exports:e)[o]=r[o]}}("undefined"!=typeof self?self:this,function(e){return function(e){function t(o){if(r[o])return r[o].exports;var n=r[o]={i:o,l:!1,exports:{}};return e[o].call(n.exports,n,n.exports,t),n.l=!0,n.exports}var r={};return t.m=e,t.c=r,t.d=function(e,r,o){t.o(e,r)||Object.defineProperty(e,r,{configurable:!1,enumerable:!0,get:o})},t.n=function(e){var r=e&&e.__esModule?function(){return e.default}:function(){return e};return t.d(r,"a",r),r},t.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},t.p="",t(t.s=0)}([function(e,t,r){function o(e,t,r){e[t]?(e[v+t]=e[t],e[t]=((...o)=>{r.call(this,o,t),e[v+t].call(this,...o)})):e[t]=((...e)=>{r.call(this,...e,t)})}const n=r(1);var s,a,i,p,c=!1,u=!1,m=!1,x=!1;const d="predem_custom_event",l="predem_http_event",g="predem_log_event",f="predem_crash_event",y="auto_captured",v="_origin_",h=()=>{O(),b(),j(),J(),setTimeout(h,1e4)},_=(e,t)=>{var r=D();r.type="custom",r.name=e,t&&(r.content=JSON.stringify(t)),k(d,r)},w=e=>{var t=D();t.type=y,t.name="monitor",e&&(t.content=JSON.stringify(e)),k(l,t)},S=e=>{var t=D();t.type=y,t.name="log",e&&(t.content=JSON.stringify(e)),k(g,t)},k=(e,t)=>{wx.getStorage({key:e,success:r=>{let o=r.data;o.push(JSON.stringify(t)),wx.setStorage({key:e,data:o})},fail:()=>{let r=[JSON.stringify(t)];wx.setStorage({key:e,data:r})}})},O=()=>{m||(m=!0,wx.getStorage({key:d,success:function(e){N("custom-events",e.data,()=>{wx.removeStorage({key:d})})},complete:()=>{m=!1}}))},b=()=>{c||(c=!0,wx.getStorage({key:l,success:e=>{N("http-monitors",e.data,()=>{wx.removeStorage({key:l})})},complete:()=>{c=!1}}))},j=()=>{u||(u=!0,wx.getStorage({key:g,success:e=>{N("log-capture",e.data,e=>{wx.removeStorage({key:g})})},complete:()=>{u=!1}}))},J=()=>{x||(x=!0,wx.getStorage({key:f,success:e=>{N("crashes",e.data,e=>{wx.removeStorage({key:f})})},complete:()=>{x=!1}}))},N=(e,t,r)=>{let o=t.join("\n");wx.request({url:a+"/v2/"+i+"/"+e,data:o,method:"POST",success:e=>{e.statusCode>=200&&e.statusCode<300&&r(e)}})},C=e=>{var t="",r="";const o=e.split("//");var n;let s=(n=1===o.length?o[0]:o[1]).indexOf("/");return-1==s?t=n:(t=n.substring(0,s),r=n.substring(s,n.length)),{domain:t,path:r}},D=()=>{const e=wx.getSystemInfoSync(),t=getCurrentPages();var r={time:Date.now(),sdk_version:"1.0.0",sdk_id:(()=>{let e=(new Date).getTime();return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,t=>{const r=(e+16*Math.random())%16|0;return e=Math.floor(e/16),("x"==t?r:3&r|8).toString(16)})})(),device_model:e.model,mini_program_type:"WeChat",mini_program_version:e.version,mini_program_sdk_version:e.SDKVersion};if(p&&(r.app_version=p),s&&(r.tag=s),0!=t.length){let e=t[t.length-1].route;e&&(r.path=e)}return r};e.exports={setOpenId:e=>{s=e||""},captureCustomEvent:(e,t)=>{_(e,t)},request:e=>{var t={start_timestamp:Date.now()};if(e&&(e.method?t.method=e.method:t.method="GET",e.url)){let r=C(e.url);r&&r.domain&&(t.domain=r.domain),r&&r.path&&(t.path=r.path)}var r=Object.assign({},e);o(r,"success",e=>{t.end_timestamp=Date.now(),t.status_code=e.statusCode,e.data&&(t.data_length=JSON.stringify(e.data).length),w(t)}),o(r,"fail",e=>{t.end_timestamp=Date.now(),t.network_error_msg=e.errMsg,w(t)}),wx.request(r)}};const T=()=>{setTimeout(()=>{var t=getApp().onError;let r=e=>{(e=>{var t=D();t.type=y,t.name="crash",e&&(t.content=JSON.stringify(e)),k(f,t)})({crash_log_key:e})};var o=r;t&&(o=(e=>{t(e),r(e)})),App({dem:e.exports,onError:o})},0)};24===n.appKey.length?0!=n.domain.length?(a=n.domain,i=n.appKey.substring(0,8),p=n.appVersion||"",(()=>{const e=["debug","info","warn","error","log"];for(const t of e)o(console,t,(...e)=>{S({level:t,message:e[0]})})})(),T(),setTimeout(h,1e4)):console.error("请正确设置 domain，不能为空"):console.error("请正确设置 appKey，长度为 24")},function(t,r){t.exports=e}])});