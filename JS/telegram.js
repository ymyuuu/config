var botToken = '5975737743:AAFxFhwL8_VIvZRkqXYeDVngTH3zXaqhy68';
var chatId = '5957163999';

function sendMessageToTelegram(data, retryCount) {
	// 构建Telegram API请求的URL
	var apiUrl = `https://go.030101.xyz/https://api.telegram.org/bot${botToken}/sendMessage`;

	// 发送POST请求到Telegram Bot API
	fetch(apiUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		})
		.then(response => response.json())
		.then(data => {
			console.log('Successful!');
			console.log(data); // 输出 Telegram API 返回的数据
		})
		.catch(error => {
			console.error('Error:', error);
			if (retryCount > 0) {
				// 如果还有重试次数，进行重试
				console.log('Retrying...');
				sendMessageToTelegram(data, retryCount - 1);
			} else {
				console.log('Exceeded maximum retries.');
			}
		});
}

function callback(ip, location, asn, org) {
	// 检查Location是否包含“中国”
	if (location.includes("中国")) {
		// 替换第一个“中国”为一个空字符串
		location = location.replace("中国 ", "");

		// 获取当前时间
		var currentDate = new Date();
		var currentTime = currentDate.toLocaleString(); // 将时间格式化为字符串

		// 构建要发送的消息内容，使用Markdown格式
		var message = `
*${currentTime}*
		
*Y IP:* \`${ip}\`
		
*Location:* ${location}
*ASN:* ${asn}
*Organization:* ${org}
		`;

		// 准备要发送的数据，指定Markdown格式
		var data = {
			chat_id: chatId,
			text: message,
			parse_mode: 'Markdown'
		};

		// 设置重试次数
		var maxRetries = 3;

		// 开始发送消息，带有重试策略
		sendMessageToTelegram(data, maxRetries);
	} else {
		// 如果不包含“中国”，在控制台输出信息
		console.log(`Stop! ${location}`);
	}
}
