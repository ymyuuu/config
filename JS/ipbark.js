    // 定义一个自执行函数，立即运行
    (function sendToBark(retryCount = 10) {
        // 向 IP 获取 API 发送请求
        fetch('https://api.qjqq.cn/api/Local')
            .then(response => response.json())  // 解析 JSON 数据
            .then(data => {
                // 检查响应数据的 code 是否为 200，表示请求成功
                if (data.code === 200) {
                    // 构建 IP 信息字符串，将各个字段连接成一行
                    const ipDetails = [
                        data.data.ip,         // IP 地址
                        data.data.country,    // 国家
                        data.data.prov,       // 省份
                        data.data.city,       // 城市
                        data.data.isp,        // 互联网服务提供商
                        data.time             // 获取时间
                    ].filter(Boolean).join(', ');  // 使用逗号连接非空的字段

                    console.log(ipDetails);  // 输出 IP 信息到浏览器开发者工具的控制台

                    // 构建 Bark 推送 URL，不直接加 group 参数
                    const barkUrl = new URL(`https://api.day.app/Y6wZN8swvDrno2URYa5CDZ/${encodeURIComponent(document.title)}/${encodeURIComponent(ipDetails)}`);
                    barkUrl.searchParams.set('group', 'zzy');  // 添加 group 参数

                    // 发送请求到 Bark
                    fetch(barkUrl.toString());
                }
            })
            .catch(() => {
                // 如果请求失败，且重试次数大于 0，则进行重试
                if (retryCount > 0) {
                    setTimeout(() => sendToBark(retryCount - 1), 1000);  // 等待 1 秒后重试
                }
            });
    })();  // 调用函数并立即执行
