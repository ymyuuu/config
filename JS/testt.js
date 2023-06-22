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
            $.get(req, (error, response, data) => {
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
                        has: true,
                        context: upstr + '👉:' + '\n' + req.url + '\n\n'
                    }
                } else {
                    result[name] = {
                        has: false,
                        context: '暂无车位' + '\n\n'
                    }
                }
                resolve(result)
            })
        })
    }

    function doNotify(res) {
        return Promise.all(res).then((results) => {
            $.log(JSON.stringify(results))
            for (let i in results) {
                let result = results[i]
                if (JSON.stringify(result) == '{}') {
                    continue
                }
                for (name in result) {
                    let has = result[name].has
                    if (has) {
                        let hastr =
                            '[' + name + ']' + '\n' + result[name].context
                        $.msg('TestFilght监控', '', hastr)
                    } else {
                        let nostr =
                            '[' + name + ']' + '\n' + result[name].context
                        if (isNotify == 'false') {
                            $.msg('TestFilght监控', '', nostr)
                        } else {
                            $.log('TestFilght监控', '', nostr)
                        }
                    }
                }
            }
        })
    }
    // $done() 或 $.done() 都可以
    // $done() 或 $.done() 都可以
})()
    .catch((e) => $.logErr(e))
    .finally(() => $.done())
