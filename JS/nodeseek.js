// 获取当前请求 URL，例如： https://www.nodeseek.com/jump?to=...
let url = request.url;

// 解析 URL 参数
let params = new URL(url).searchParams;
let encodedTarget = params.get("to");

// 对百分号编码内容进行解码
let targetUrl = decodeURIComponent(encodedTarget);

// 返回302重定向
return {
    status: 302,
    headers: {
        "Location": targetUrl
    }
};
