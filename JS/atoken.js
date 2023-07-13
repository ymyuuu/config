/*
阿里云盘签到-lowking-v1.1.0

按下面配置完之后，打开阿里云盘获取token（如获取不到，等一段时间再打开），下面配置只验证过surge的，其他的自行测试
⚠️只测试过surge没有其他app自行测试

************************
Surge 4.2.0+ 脚本配置(其他APP自行转换配置):
************************

[Script]
# > 阿里云盘签到
https://auth.aliyundrive.com/v2/account/token
阿里云盘签到cookie = requires-body=1,type=http-response,pattern=https:\/\/auth.aliyundrive.com\/v2\/account\/token,script-path=https://raw.githubusercontent.com/lowking/Scripts/master/ali/aliYunPanCheckIn.js
阿里云盘签到 = type=cron,cronexp="0 10 0 * * ?",wake-system=1,script-path=https://raw.githubusercontent.com/lowking/Scripts/master/ali/aliYunPanCheckIn.js

[MITM]
hostname = %APPEND% auth.aliyundrive.com
*/
const lk = new ToolKit(`阿里云盘签到`, `AliYunPanCheckIn`, {"httpApi": "ffff@10.0.0.19:6166"})
const aliYunPanTokenKey = 'lkAliYunPanTokenKey'
let aliYunPanToken = lk.getVal(aliYunPanTokenKey, '')
const aliYunPanRefreshTokenKey = 'lkAliYunPanRefreshTokenKey'
let aliYunPanRefreshToken = lk.getVal(aliYunPanRefreshTokenKey, '')
const checkSignInRepeatKey = 'aliYunPanSignInRepeat'
const checkSignInRepeat = lk.getVal(checkSignInRepeatKey, '')
const joinTeamRepeatKey = 'aliYunPanJoinTeamRepeat'
const joinTeamRepeat = lk.getVal(joinTeamRepeatKey, -1)
lk.userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 15_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 D/C501C6D2-FAF6-4DA8-B65B-7B8B392901EB"

if(!lk.isExecComm) {
    if (lk.isRequest()) {
        getCookie()
        lk.done()
    } else {
        lk.boxJsJsonBuilder({
            "icons": [
                "https://raw.githubusercontent.com/lowking/Scripts/master/doc/icon/aliYunPana.png",
                "https://raw.githubusercontent.com/lowking/Scripts/master/doc/icon/aliYunPan.png"
            ],
            "settings": [
                {
                    "id": aliYunPanTokenKey,
                    "name": "阿里云盘token",
                    "val": "",
                    "type": "text",
                    "desc": "阿里云盘token"
                }, {
                    "id": aliYunPanRefreshTokenKey,
                    "name": "阿里云盘refresh_token",
                    "val": "",
                    "type": "text",
                    "desc": "阿里云盘refresh_token"
                }
            ],
            "keys": [aliYunPanTokenKey, aliYunPanRefreshTokenKey]
        }, {
            "script_url": "https://github.com/lowking/Scripts/blob/master/ali/aliYunPanCheckIn.js",
            "author": "@lowking",
            "repo": "https://github.com/lowking/Scripts",
        })
        all()
    }
}

function getCookie() {
    if (lk.isGetCookie(/\/v2\/account\/token/)) {
        lk.log(`开始获取cookie`)
        let data = lk.getResponseBody()
        // lk.log(`获取到的cookie：${data}`)
        try {
            data = JSON.parse(data)
            let refreshToken = data["refresh_token"]
            if (refreshToken) {
                lk.setVal(aliYunPanRefreshTokenKey, refreshToken)
                lk.appendNotifyInfo('🎉成功获取阿里云盘refresh_token，可以关闭相应脚本')
            } else {
                lk.execFail()
                lk.appendNotifyInfo('❌获取阿里云盘token失败，请稍后再试')
            }
        } catch (e) {
            lk.execFail()
            lk.appendNotifyInfo('❌获取阿里云盘token失败')
        }
        lk.msg('')
    }
}

async function all() {
    let hasNeedSendNotify = true
    if (aliYunPanRefreshToken == '') {
        lk.execFail()
        lk.appendNotifyInfo(`⚠️请先打开阿里云盘登录获取refresh_token`)
    } else {
        await refreshToken()
        let hasAlreadySignIn = await signIn()
        await joinTeam()
    }
    if (hasNeedSendNotify) {
        lk.msg(``)
    }
    lk.done()
}
