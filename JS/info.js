const API_URL = 'https://api-ipv4.ip.sb/geoip';
			const TELEGRAM_API_URL =
				'https://go.030101.xyz/https://api.telegram.org/bot'; // Replace with your Telegram Bot API URL
			const TOKEN = ''; // Replace with your Telegram Bot API Token
			const CHAT_ID = ''; // Replace with your Telegram Chat ID

			async function fetchDataAndPush() {
				try {
					const data = await fetchIPData(API_URL);
					if (data) {
						// 查询IP的具体位置
						const ipDetails = await fetchIPDetails(data.ip);
						if (ipDetails) {
							// 检查国家代码，如果不是中国（'CN'），则不推送到 Telegram
							if (data.country_code !== 'CN') {
								console.log('IP不属于中国地区，不推送到 Telegram。');
								return;
							}
							const message = await createMessage(data, ipDetails);
							await pushToTelegram(message);
						}
					}
				} catch (error) {
					console.error('发生错误：', error);
				}
			}

			async function fetchIPData(url) {
				let attempts = 10; // 设置最大尝试次数
				while (attempts > 0) {
					try {
						const response = await fetch(url);
						if (response.ok) {
							return await response.json();
						}
					} catch (error) {
						console.error('获取 IP 数据时发生错误：', error);
					}
					attempts--;
				}
				console.error('无法获取 IP 数据');
				return null;
			}

			async function createMessage(data, ipDetails) {
				const currentTime = new Date();
				const formattedTime = currentTime.toLocaleString(); // 格式化时间

				return `
			*${formattedTime}*
			
			*Info IP:* \`${data.ip}\`
			
			*Location:* \`${ipDetails.ipdata.info1} ${ipDetails.ipdata.info2}\`
			*Long/Lat:* \`${data.longitude}/${data.latitude}\`
			`;
			}
			// \`${data.organization}\`




			async function pushToTelegram(message) {
				try {
					const telegramResponse = await fetch(`${TELEGRAM_API_URL}${TOKEN}/sendMessage`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({
							chat_id: CHAT_ID,
							text: message,
							parse_mode: "Markdown" // 添加 Markdown 解析模式
						})
					});

					const responseData = await telegramResponse.json();
					if (responseData.ok) {
						console.log('消息已成功推送到 Telegram:', responseData);
					} else {
						console.error('推送到 Telegram 失败:', responseData);
					}
				} catch (error) {
					console.error('推送到 Telegram 时发生错误：', error);
				}
			}


			async function fetchIPDetails(ip) {
				try {
					const response = await fetch(`https://api.vore.top/api/IPdata?ip=${ip}`);
					if (response.ok) {
						return await response.json();
					}
					console.error('获取IP详情时发生错误');
					return null;
				} catch (error) {
					console.error('获取IP详情时发生错误：', error);
					return null;
				}
			}

			fetchDataAndPush();
