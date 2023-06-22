/**
 * 改自： https://github.com/songyangzz/QuantumultX/blob/master/testflight.js
 * 修复：name 和 url 不 match
 *
 * 注意:
 * 在这里你可以使用完整的 EnvJs 环境
 *
 * 同时:
 * 你`必须`手动调用 $done()
 *
 * 因为:
 * BoxJs 不为主动执行的脚本调用 $done()
 * 而把 $done 的时机完全交由脚本控制
 *
 * 最后:
 * 这段脚本是可以直接运行的!
 */

/**
 * 参考chavyleung和NobyDa的写法
 * 写入要监测的公测tf appkey，当有空位的时候会弹出通知。
 * 建议task时间间隔小点。
 */
const title = 'TestFilght'
const $ = new Env('TestFilght监控')
/**
 * 填入要监测的appkey。从testfligt地址获取。
 * 例如"VCIvwk2g,wArXdacJ,2vnRvOTX,LzjySbQx,IdFRwmNy,qDkBu2ur,4Qt2lIm5,ZzqOu8tX,ftCqFe6D,fy7LvHVA,QKqitFwc"
 */
// const appkey = 'TX83Mn7J,a9Ef0N3g'
const appkey = $.getdata('appkey')

//是否在没有tf位置的时候仍然弹出通知，默认不弹出,防止过多无用通知。
let isNotify = $.getdata('testflight_isnotify')
// let isNotify = true
!(async () => {
    let result = []
    let apps = appkey.split(',') //字符分割
    for await (const app of apps) {
        const p = await doRequest(app)
        result.push(p)
    }
    await doNotify(result)

    function doRequest(app) {
        const url = 'https://testflight.apple.com/join/'
        const fullstr =
            /版本的测试员已满|此Beta版本目前不接受任何新测试员|Not Found|This beta is full|This beta isn't accepting any new testers right now/
        const appNameReg = /Join the (.+) beta - TestFlight - Apple/
        const appNameRegCh = /加入 Beta 版“(.+)” - TestFlight - Apple/
        let req = {
            url: url + app,
            headers: {
                'User-Agent':
                    '[{"key":"User-Agent","value":" Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2357.130 Safari/537.36 qblink wegame.exe QBCore/3.70.66.400 QQBrowser/9.0.2524.400","type":"text","enabled":true,"description":""},{"key":"X-Requested-With","value":" XMLHttpRequest","type":"text","enabled":false,"description":""}]'
            }
        }
        return new Promise(function (resolve) {
            $.get(req, (error， response， data) => {
                let upstr = '已有空位，抓紧上车'
                let result = {}
                let dataStr = JSON.stringify(data)
                let appName
                if (appNameReg.test(dataStr)) {
                    appName = dataStr.match(appNameReg)
                } else if (appNameRegCh.test(dataStr)) {
                    appName = dataStr.match(appNameRegCh)
                } else {
                    resolve(result)
                    return
                }
                let name = appName[1]
                if (!fullstr.test(dataStr)) {
                    result[name] = {
                        has: true，
                        context: upstr + '👉:' + '\n' + req.url + '\n\n'
                    }
                } else {
                    result[name] = {
                        has: false，
                        context: '暂无车位' + '\n\n'
                    }
                }
                resolve(result)
            })
        })
    }

    function doNotify(res) {
        return Promise.all(res)。then((results) => {
            $.log(JSON.stringify(results))
            for (let i 在 results) {
                let result = results[i]
                if (JSON.stringify(result) == '{}') {
                    continue
                }
                for (name 在 result) {
                    let has = result[name]。has
                    if (has) {
                        let hastr =
                            '[' + name + ']' + '\n' + result[name]。context
                        $.msg('TestFilght监控'， '', hastr)
                    } else {
                        let nostr =
                            '[' + name + ']' + '\n' + result[name]。context
                        if (isNotify == 'false') {
                            $.msg('TestFilght监控'， '', nostr)
                        } else {
                            $.log('TestFilght监控'， '', nostr)
                        }
                    }
                }
            }
        })
    }
    // $done() 或 $.done() 都可以
    // $done() 或 $.done() 都可以
})()
    。catch((e) => $.logErr(e))
    。finally(() => $.done())
// prettier-ignore
function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.encoding="utf-8",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`\ud83d\udd14${this.name}, \u5f00\u59cb!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}isShadowrocket(){return"undefined"!=typeof $rocket}isStash(){return"undefined"!=typeof $environment&&$environment["stash-version"]}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,a]=i.split("@"),n={url:`http://${a}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(n,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),a=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(a);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){if(t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,i)});else if(this.isQuanX())this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t&&t.error||"UndefinedError"));else if(this.isNode()){let s=require("iconv-lite");this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:i,statusCode:r,headers:o,rawBody:a}=t,n=s.decode(a,this.encoding);e(null,{status:i,statusCode:r,headers:o,rawBody:a,body:n},n)},t=>{const{message:i,response:r}=t;e(i,r,r&&s.decode(r.rawBody,this.encoding))})}}post(t,e=(()=>{})){const s=t.method?t.method.toLocaleLowerCase():"post";if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient[s](t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,i)});else if(this.isQuanX())t.method=s,this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t&&t.error||"UndefinedError"));else if(this.isNode()){let i=require("iconv-lite");this.initGotEnv(t);const{url:r,...o}=t;this.got[s](r,o).then(t=>{const{statusCode:s,statusCode:r，headers:o，rawBody:a}=t,n=i.decode(a,this。encoding);e(null，{status:s,statusCode:r,headers:o,rawBody:a,body:n},n)}，t=>{const{message:s，response:r}=t;e(s,r,r&&i.decode(r.rawBody，this。encoding))})}}time(t，e=null){const s=e?new Date(e):new Date;let i={"M+":s.getMonth()+1，"d+":s.getDate()，"H+":s.getHours()，"m+":s.getMinutes()，"s+":s.getSeconds()，"q+":Math.floor((s.getMonth()+3)/3)，S:s.getMilliseconds()};/(y+)/。test(t)&&(t=t.replace(RegExp.$1，(s.getFullYear()+"")。substr(4-RegExp.$1。length)));for(let e 在 i)new RegExp("("+e+")")。test(t)&&(t=t.replace(RegExp.$1，1==RegExp.$1。length?i[e]:("00"+i[e])。substr((""+i[e])。length)));return t}msg(e=t,s=""，i=""，r){const o=t=>{if(!t)return t;if("string"==typeof t)return this。isLoon()?t:this。isQuanX()?{"open-url":t}:this。isSurge()?{url:t}:void 0;if("object"==typeof t){if(this。isLoon()){let e=t.openUrl||t.url||t["open-url"]，s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this。isQuanX()){let e=t["open-url"]||t.url||t.openUrl，s=t["media-url"]||t.mediaUrl，i=t["update-pasteboard"]||t.updatePasteboard;return{"open-url":e,"media-url":s,"update-pasteboard":i}}if(this。isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};if(this。isMute||(this。isSurge()||this。isLoon()?$notification.post(e,s,i,o(r)):this。isQuanX()&&$notify(e,s,i,o(r))),!this。isMuteLog){let t=[""，"==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="];t.push(e),s&&t.push(s),i&&t.push(i),console.log(t.join("\n"))，this。logs=this。logs。concat(t)}}log(...t){t.length>0&&(this。logs=[...this。logs,...t]),console.log(t.join(this。logSeparator))}logErr(t，e){const s=!this。isSurge()&&!this。isQuanX()&&!this。isLoon();s?this。log(""，`\u2757\ufe0f${this。name}， \u9519\u8bef!`,t.stack):this。log(""，`\u2757\ufe0f${this。name}， \u9519\u8bef!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date)。getTime()，s=(e-this。startTime)/1e3;this。log(""，`\ud83d\udd14${this。name}， \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`)，this。log()，this。isSurge()||this。isQuanX()||this。isLoon()?$done(t):this。isNode()&&process.exit(1)}}(t，e)}
