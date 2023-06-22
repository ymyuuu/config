/**
 * 参考chavyleung和NobyDa的写法
 * 写入要监测的公测tf appkey，当有空位的时候会弹出通知。
 * 建议task时间间隔小点。
 */
const title = 'TestFilght'
const $ = new Env('TestFilght监控')

const appkey = $.getdata('appkey')
let isNotify = $.getdata('testflight_isnotify') || '是'

!(async () => {
    let result = []
    let apps = appkey.split(',')
    for await (const app of apps) {
        const p = await doRequest(app)
        result.push(p)
    }
    await doNotify(result)

    function doRequest(app) {
        const url = 'https://testflight.apple.com/join/'
        const fullstr = /版本的测试员已满|此Beta版本目前不接受任何新测试员|Not Found|This beta is full|This beta isn't accepting any new testers right now/
        const appNameReg = /Join the (.+) beta - TestFlight - Apple/
        const appNameRegCh = /加入 Beta 版“(.+)” - TestFlight - Apple/
        let req = {
            url: url + app,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2357.130 Safari/537.36 qblink wegame.exe QBCore/3.70.66.400 QQBrowser/9.0.2524.400',
                'X-Requested-With': 'XMLHttpRequest'
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
                        context: upstr + '👉: [' + name + '](' + req.url + app + ')'
                    }
                } else {
                    result[name] = {
                        has: false,
                        context: fullstr.test(dataStr) ? '无空位👉: [' + name + '](' + req.url + app + ')' : '访问失败👉: [' + name + '](' + req.url + app + ')'
                    }
                }
                resolve(result)
            })
        })
    }

    function doNotify(r) {
        return new Promise(async resolve => {
            let hastr = ''
            let nostr = ''
            for (let i in r) {
                hastr += r[i].context + '\n'
                if (!r[i].has) {
                    nostr += r[i].context + '\n'
                }
            }
            if (nostr) {
                if (isNotify === '是') {
                    $.msg(title, '', nostr)
                } else {
                    console.log(title, '', nostr)
                }
            } else {
                if (hastr) {
                    if (isNotify === '是') {
                        $.msg(title, '', hastr)
                    } else {
                        console.log(title, '', hastr)
                    }
                }
            }
            resolve()
        })
    }
})()
