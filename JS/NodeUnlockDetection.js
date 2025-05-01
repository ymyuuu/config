/*
 * 节点解锁查询
 * 感谢并修改自 https://raw.githubusercontent.com/KOP-XIAO/QuantumultX/master/Scripts/streaming-ui-check.js
 * 脚本功能：检查节点是否支持Dazn/Discovery/Param/Disney/Netflix/ChatGPT/YouTube解锁服务
 * 原作者：XIAO_KOP
 */

// 定义常量
const CONFIG = {
    // 请求超时时间（毫秒）
    TIMEOUT: 10000,
    // 最大重试次数
    MAX_RETRIES: 2
};

// 流媒体服务接口
const API = {
    NETFLIX: "https://www.netflix.com/title/81280792",
    DISNEY: "https://www.disneyplus.com",
    DISNEY_LOCATION: "https://disney.api.edge.bamgrid.com/graph/v1/device/graphql",
    YOUTUBE: "https://www.youtube.com/premium",
    DAZN: "https://startup.core.indazn.com/misl/v5/Startup",
    PARAMOUNT: "https://www.paramountplus.com/",
    DISCOVERY_TOKEN: "https://us1-prod-direct.discoveryplus.com/token?deviceId=d1a4a5d25212400d1e6985984604d740&realm=go&shortlived=true",
    DISCOVERY: "https://us1-prod-direct.discoveryplus.com/users/me",
    CHATGPT: "https://chatgpt.com/",
    CHATGPT_REGION: "https://chatgpt.com/cdn-cgi/trace",
    GOOGLE: "https://www.google.com/maps/timeline"
};

// 国家/地区国旗映射
const FLAGS = new Map([
    ["AC", "🇦🇨"], ["AE", "🇦🇪"], ["AF", "🇦🇫"], ["AI", "🇦🇮"], ["AL", "🇦🇱"], 
    ["AM", "🇦🇲"], ["AQ", "🇦🇶"], ["AR", "🇦🇷"], ["AS", "🇦🇸"], ["AT", "🇦🇹"], 
    ["AU", "🇦🇺"], ["AW", "🇦🇼"], ["AX", "🇦🇽"], ["AZ", "🇦🇿"], ["BA", "🇧🇦"], 
    ["BB", "🇧🇧"], ["BD", "🇧🇩"], ["BE", "🇧🇪"], ["BF", "🇧🇫"], ["BG", "🇧🇬"], 
    ["BH", "🇧🇭"], ["BI", "🇧🇮"], ["BJ", "🇧🇯"], ["BM", "🇧🇲"], ["BN", "🇧🇳"], 
    ["BO", "🇧🇴"], ["BR", "🇧🇷"], ["BS", "🇧🇸"], ["BT", "🇧🇹"], ["BV", "🇧🇻"], 
    ["BW", "🇧🇼"], ["BY", "🇧🇾"], ["BZ", "🇧🇿"], ["CA", "🇨🇦"], ["CF", "🇨🇫"], 
    ["CH", "🇨🇭"], ["CK", "🇨🇰"], ["CL", "🇨🇱"], ["CM", "🇨🇲"], ["CN", "🇨🇳"], 
    ["CO", "🇨🇴"], ["CP", "🇨🇵"], ["CR", "🇨🇷"], ["CU", "🇨🇺"], ["CV", "🇨🇻"], 
    ["CW", "🇨🇼"], ["CX", "🇨🇽"], ["CY", "🇨🇾"], ["CZ", "🇨🇿"], ["DE", "🇩🇪"], 
    ["DG", "🇩🇬"], ["DJ", "🇩🇯"], ["DK", "🇩🇰"], ["DM", "🇩🇲"], ["DO", "🇩🇴"], 
    ["DZ", "🇩🇿"], ["EA", "🇪🇦"], ["EC", "🇪🇨"], ["EE", "🇪🇪"], ["EG", "🇪🇬"], 
    ["EH", "🇪🇭"], ["ER", "🇪🇷"], ["ES", "🇪🇸"], ["ET", "🇪🇹"], ["EU", "🇪🇺"], 
    ["FI", "🇫🇮"], ["FJ", "🇫🇯"], ["FK", "🇫🇰"], ["FM", "🇫🇲"], ["FO", "🇫🇴"], 
    ["FR", "🇫🇷"], ["GA", "🇬🇦"], ["GB", "🇬🇧"], ["HK", "🇭🇰"], ["HU", "🇭🇺"], 
    ["ID", "🇮🇩"], ["IE", "🇮🇪"], ["IL", "🇮🇱"], ["IM", "🇮🇲"], ["IN", "🇮🇳"], 
    ["IS", "🇮🇸"], ["IT", "🇮🇹"], ["JP", "🇯🇵"], ["KR", "🇰🇷"], ["LU", "🇱🇺"], 
    ["MO", "🇲🇴"], ["MX", "🇲🇽"], ["MY", "🇲🇾"], ["NL", "🇳🇱"], ["PH", "🇵🇭"], 
    ["PL", "🇵🇱"], ["RO", "🇷🇴"], ["RS", "🇷🇸"], ["RU", "🇷🇺"], ["RW", "🇷🇼"], 
    ["SA", "🇸🇦"], ["SB", "🇸🇧"], ["SC", "🇸🇨"], ["SD", "🇸🇩"], ["SE", "🇸🇪"], 
    ["SG", "🇸🇬"], ["TH", "🇹🇭"], ["TN", "🇹🇳"], ["TO", "🇹🇴"], ["TR", "🇹🇷"], 
    ["TV", "🇹🇻"], ["TW", "🇨🇳"], ["UK", "🇬🇧"], ["UM", "🇺🇲"], ["US", "🇺🇸"], 
    ["UY", "🇺🇾"], ["UZ", "🇺🇿"], ["VA", "🇻🇦"], ["VE", "🇻🇪"], ["VG", "🇻🇬"], 
    ["VI", "🇻🇮"], ["VN", "🇻🇳"], ["ZA", "🇿🇦"]
]);

// 获取节点名称
var inputParams = $environment.params;
var nodeName = inputParams.node;

// 初始化结果对象
let result = {
    "title": '节点解锁查询',
    "YouTube": '<b>YouTube Premium: </b>检测失败，请重试 ❗️',
    "Netflix": '<b>Netflix: </b>检测失败，请重试 ❗️',
    "Dazn": "<b>Dazn: </b>检测失败，请重试 ❗️",
    "Disney": "<b>Disney+: </b>检测失败，请重试 ❗️",
    "Paramount": "<b>Paramount+: </b>检测失败，请重试 ❗️",
    "Discovery": "<b>Discovery+: </b>检测失败，请重试 ❗️",
    "ChatGPT": "<b>ChatGPT: </b>检测失败，请重试 ❗️"
};

// 箭头样式
const ARROW = " ➟ ";

// 通用HTTP请求函数（带重试）
function makeRequest(options, retryCount = 0) {
    return new Promise((resolve, reject) => {
        // 默认设置超时
        if (!options.timeout) {
            options.timeout = CONFIG.TIMEOUT;
        }
        // 添加节点
        if (!options.node) {
            options.node = nodeName;
        }
        
        // 判断是GET还是POST请求
        const requestMethod = options.body ? 'post' : 'get';
        
        $httpClient[requestMethod](options, (error, response, data) => {
            if (error) {
                console.log(`${options.label || '请求'} 失败: ${error}`);
                
                // 如果还有重试次数，则重试
                if (retryCount < CONFIG.MAX_RETRIES) {
                    console.log(`正在进行第 ${retryCount + 1} 次重试...`);
                    resolve(makeRequest(options, retryCount + 1));
                    return;
                }
                
                // 重试次数用完，返回错误
                resolve({ error, response: null, data: null });
                return;
            }
            
            // 请求成功
            resolve({ error: null, response, data });
        });
    });
}

// Netflix 检测
async function checkNetflix() {
    console.log("----------Netflix 检测开始----------");
    
    const { error, response, data } = await makeRequest({
        url: API.NETFLIX,
        label: "Netflix"
    });
    
    if (error) {
        result.Netflix = "<b>Netflix: </b>检测失败 ❗️";
        return;
    }
    
    if (response.status === 403) {
        result.Netflix = "<b>Netflix: </b>未支持 🚫";
        return;
    }
    
    if (response.status === 404) {
        result.Netflix = "<b>Netflix: </b>支持自制剧集 ⚠️";
        return;
    }
    
    if (response.status === 200) {
        let region = "未知";
        try {
            // 尝试从headers获取地区信息
            let ourl = response.headers['X-Originating-URL'] || 
                       response.headers['X-Originating-Url'] || 
                       response.headers['x-originating-url'];
                       
            if (ourl) {
                region = ourl.split('/')[3];
                region = region.split('-')[0];
                if (region === 'title') {
                    region = 'us';
                }
            }
            
            result.Netflix = `<b>Netflix: </b>完整支持${ARROW}⟦${FLAGS.get(region.toUpperCase()) || "未知"}⟧ 🎉`;
        } catch (e) {
            console.log("解析 Netflix 地区错误:", e);
            result.Netflix = `<b>Netflix: </b>完整支持${ARROW}⟦未知地区⟧ 🎉`;
        }
        return;
    }
    
    result.Netflix = "<b>Netflix: </b>检测失败 ❗️";
}

// Disney+ 检测
async function checkDisney() {
    console.log("----------Disney+ 检测开始----------");
    
    const { error, response, data } = await makeRequest({
        url: API.DISNEY_LOCATION,
        label: "Disney+",
        headers: {
            'Accept-Language': 'en',
            "Authorization": 'ZGlzbmV5JmJyb3dzZXImMS4wLjA.Cu56AgSfBTDag5NiRA81oLHkDZfu5L3CKadnefEAY84',
            'Content-Type': 'application/json',
            'User-Agent': 'UA'
        },
        body: JSON.stringify({
            query: 'mutation registerDevice($input: RegisterDeviceInput!) { registerDevice(registerDevice: $input) { grant { grantType assertion } } }',
            variables: {
                input: {
                    applicationRuntime: 'chrome',
                    attributes: {
                        browserName: 'chrome',
                        browserVersion: '94.0.4606',
                        manufacturer: 'microsoft',
                        model: null,
                        operatingSystem: 'windows',
                        operatingSystemVersion: '10.0',
                        osDeviceIds: [],
                    },
                    deviceFamily: 'browser',
                    deviceLanguage: 'en',
                    deviceProfile: 'windows',
                },
            },
        })
    });
    
    if (error) {
        result.Disney = "<b>Disney+: </b>检测失败 ❗️";
        return;
    }
    
    if (response.status !== 200) {
        result.Disney = "<b>Disney+: </b>检测失败 ❗️";
        return;
    }
    
    try {
        const resData = JSON.parse(data);
        if (resData?.extensions?.sdk?.session != null) {
            const { inSupportedLocation, location: { countryCode } } = resData.extensions.sdk.session;
            
            if (inSupportedLocation === false) {
                result.Disney = `<b>Disney+: </b>即将登陆 ${ARROW}⟦${FLAGS.get(countryCode.toUpperCase()) || "未知"}⟧ ⚠️`;
            } else {
                result.Disney = `<b>Disney+: </b>支持 ${ARROW}⟦${FLAGS.get(countryCode.toUpperCase()) || "未知"}⟧ 🎉`;
            }
        } else {
            result.Disney = "<b>Disney+: </b>未支持 🚫";
        }
    } catch (e) {
        console.log("解析 Disney+ 数据错误:", e);
        result.Disney = "<b>Disney+: </b>检测失败 ❗️";
    }
}

// YouTube Premium 检测
async function checkYouTube() {
    console.log("----------YouTube Premium 检测开始----------");
    
    const { error, response, data } = await makeRequest({
        url: API.YOUTUBE,
        label: "YouTube Premium",
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36'
        }
    });
    
    if (error || response.status !== 200) {
        result.YouTube = "<b>YouTube Premium: </b>检测失败 ❗️";
        return;
    }
    
    try {
        if (data.indexOf('Premium is not available in your country') !== -1) {
            result.YouTube = "<b>YouTube Premium: </b>未支持 🚫";
            return;
        }
        
        // 检测支持的地区
        let region = 'US';
        let re = new RegExp('"GL":"(.*?)"', 'gm');
        let ret = re.exec(data);
        
        if (ret != null && ret.length === 2) {
            region = ret[1];
        } else if (data.indexOf('www.google.cn') !== -1) {
            region = 'CN';
        }
        
        result.YouTube = `<b>YouTube Premium: </b>支持 ${ARROW}⟦${FLAGS.get(region.toUpperCase()) || "未知"}⟧ 🎉`;
    } catch (e) {
        console.log("解析 YouTube Premium 数据错误:", e);
        result.YouTube = "<b>YouTube Premium: </b>检测失败 ❗️";
    }
}

// ChatGPT 检测
async function checkChatGPT() {
    console.log("----------ChatGPT 检测开始----------");
    
    // 第一步: 检查是否可以访问 ChatGPT
    const { error, response } = await makeRequest({
        url: API.CHATGPT,
        label: "ChatGPT"
    });
    
    if (error) {
        result.ChatGPT = "<b>ChatGPT: </b>检测失败 ❗️";
        return;
    }
    
    // 如果状态码是403，则表示不支持
    if (response.status === 403) {
        result.ChatGPT = "<b>ChatGPT: </b>未支持 🚫";
        return;
    }
    
    // 如果可以访问，检查支持的地区
    const regionResp = await makeRequest({
        url: API.CHATGPT_REGION,
        label: "ChatGPT Region"
    });
    
    if (regionResp.error) {
        // 如果获取地区失败但能访问主站，标记为支持但无法确定地区
        result.ChatGPT = "<b>ChatGPT: </b>支持但无法确定地区 ⚠️";
        return;
    }
    
    try {
        // 解析地区信息
        let region = "未知";
        if (regionResp.data.indexOf("loc=") !== -1) {
            region = regionResp.data.split("loc=")[1].split("\n")[0];
        }
        
        result.ChatGPT = `<b>ChatGPT: </b>支持 ${ARROW}⟦${FLAGS.get(region.toUpperCase()) || "未知"}⟧ 🎉`;
    } catch (e) {
        console.log("解析 ChatGPT 地区数据错误:", e);
        result.ChatGPT = "<b>ChatGPT: </b>支持但无法确定地区 ⚠️";
    }
}

// Dazn 检测
async function checkDazn() {
    console.log("----------Dazn 检测开始----------");
    
    const { error, response, data } = await makeRequest({
        url: API.DAZN,
        label: "Dazn",
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            LandingPageKey: "generic",
            Platform: "web",
            PlatformAttributes: {},
            Manufacturer: "",
            PromoCode: "",
            Version: "2"
        })
    });
    
    if (error) {
        result.Dazn = "<b>Dazn: </b>检测失败 ❗️";
        return;
    }
    
    if (response.status !== 200) {
        result.Dazn = "<b>Dazn: </b>检测失败 ❗️";
        return;
    }
    
    try {
        // 解析地区信息
        let re = new RegExp('"GeolocatedCountry":"(.*?)"', 'gm');
        let ret = re.exec(data);
        
        if (ret != null && ret.length === 2) {
            let region = ret[1];
            result.Dazn = `<b>Dazn: </b>支持 ${ARROW}⟦${FLAGS.get(region.toUpperCase()) || "未知"}⟧ 🎉`;
        } else {
            result.Dazn = "<b>Dazn: </b>未支持 🚫";
        }
    } catch (e) {
        console.log("解析 Dazn 数据错误:", e);
        result.Dazn = "<b>Dazn: </b>检测失败 ❗️";
    }
}

// Paramount+ 检测
async function checkParamount() {
    console.log("----------Paramount+ 检测开始----------");
    
    const { error, response } = await makeRequest({
        url: API.PARAMOUNT,
        label: "Paramount+",
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36'
        }
    });
    
    if (error) {
        result.Paramount = "<b>Paramount+: </b>检测失败 ❗️";
        return;
    }
    
    if (response.status === 200) {
        result.Paramount = "<b>Paramount+: </b>支持 🎉";
    } else if (response.status === 302) {
        result.Paramount = "<b>Paramount+: </b>未支持 🚫";
    } else {
        result.Paramount = "<b>Paramount+: </b>检测失败 ❗️";
    }
}

// Discovery+ 检测
async function checkDiscovery() {
    console.log("----------Discovery+ 检测开始----------");
    
    // 第一步: 获取 token
    const tokenResp = await makeRequest({
        url: API.DISCOVERY_TOKEN,
        label: "Discovery+ Token",
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36'
        }
    });
    
    if (tokenResp.error || tokenResp.response.status !== 200) {
        result.Discovery = "<b>Discovery+: </b>检测失败 ❗️";
        return;
    }
    
    try {
        // 解析token
        const tokenData = JSON.parse(tokenResp.data);
        const token = tokenData.data.attributes.token;
        
        // 构建cookie
        const cookieValid = `_gcl_au=1.1.858579665.1632206782; _rdt_uuid=1632206782474.6a9ad4f2-8ef7-4a49-9d60-e071bce45e88; _scid=d154b864-8b7e-4f46-90e0-8b56cff67d05; _pin_unauth=dWlkPU1qWTRNR1ZoTlRBdE1tSXdNaTAwTW1Nd0xUbGxORFV0WWpZMU0yVXdPV1l6WldFeQ; _sctr=1|1632153600000; aam_fw=aam%3D9354365%3Baam%3D9040990; aam_uuid=24382050115125439381416006538140778858; st=${token}; gi_ls=0; _uetvid=a25161a01aa711ec92d47775379d5e4d; AMCV_BC501253513148ED0A490D45%40AdobeOrg=-1124106680%7CMCIDTS%7C18894%7CMCMID%7C24223296309793747161435877577673078228%7CMCAAMLH-1633011393%7C9%7CMCAAMB-1633011393%7CRKhpRz8krg2tLO6pguXWp5olkAcUniQYPHaMWWgdJ3xzPWQmdj0y%7CMCOPTOUT-1632413793s%7CNONE%7CvVersion%7C5.2.0; ass=19ef15da-95d6-4b1d-8fa2-e9e099c9cc38.1632408400.1632406594`;
        
        // 第二步: 检查地区
        const { error, response, data } = await makeRequest({
            url: API.DISCOVERY,
            label: "Discovery+",
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36',
                'Cookie': cookieValid
            }
        });
        
        if (error || response.status !== 200) {
            result.Discovery = "<b>Discovery+: </b>检测失败 ❗️";
            return;
        }
        
        try {
            const resData = JSON.parse(data);
            const locationd = resData.data.attributes.currentLocationTerritory;
            
            if (locationd === 'us') {
                result.Discovery = "<b>Discovery+: </b>支持 🎉";
            } else {
                result.Discovery = "<b>Discovery+: </b>未支持 🚫";
            }
        } catch (e) {
            console.log("解析 Discovery+ 数据错误:", e);
            result.Discovery = "<b>Discovery+: </b>检测失败 ❗️";
        }
    } catch (e) {
        console.log("解析 Discovery+ Token 错误:", e);
        result.Discovery = "<b>Discovery+: </b>检测失败 ❗️";
    }
}

// 主函数
async function startDetection() {
    try {
        // 并行执行所有检测
        await Promise.all([
            checkNetflix(),
            checkDisney(),
            checkYouTube(),
            checkChatGPT(),
            checkDazn(),
            checkParamount(),
            checkDiscovery()
        ]);
    } catch (error) {
        console.log("检测过程中发生错误:", error);
    } finally {
        // 生成结果页面
        const resultServices = [
            result.Dazn, 
            result.Discovery, 
            result.Paramount, 
            result.Disney, 
            result.Netflix, 
            result.ChatGPT, 
            result.YouTube
        ];
        
        let content = "------------------------------------</br>" + resultServices.join("</br></br>");
        content = content + "</br>------------------------------------</br>" + "<font color=#CD5C5C>" + "<b>节点</b> ➟ " + nodeName + "</font>";
        content = `<p style="text-align: center; font-family: -apple-system; font-size: large; font-weight: thin">` + content + `</p>`;
        
        console.log(content);
        $done({"title": result.title, "htmlMessage": content});
    }
}

// 启动检测
startDetection();
