// 安装阶段
self.addEventListener('install', (event) => {
	console.log('%c[Service Worker] 安装完成', 'color: #4caf50; font-weight: bold;'); // 绿色
	self.skipWaiting(); // 跳过等待，立即激活
});

// 激活阶段
self.addEventListener('activate', (event) => {
	console.log('%c[Service Worker] 激活完成', 'color: #2196f3; font-weight: bold;'); // 蓝色
	self.clients.claim(); // 取得控制权
});

// 定义需要缓存的路径（无论请求方法是什么）
const cachePaths = [
	'/_avatars', // 用户头像
	'/_assets', // 资源文件
	'/_private-user-images', // 私有用户图片
	'/_camo', // 伪装资源
	'/_raw' // 原始资源
];

// 定义需要跳过缓存的路径
const skipCachePaths = [
	'/login', // 登录路径
	'/sessions', // 会话路径
];

// 拦截请求并缓存（Stale-While-Revalidate 策略）
self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url); // 获取请求的URL
	const logMessage = `${event.request.method} ${url.pathname}`;

	// 跳过 chrome-extension 协议的请求
	if (url.protocol === 'chrome-extension:') return;

	// 获取请求头
	const cacheControl = event.request.headers.get('Cache-Control');
	const pragma = event.request.headers.get('Pragma');
	const authorization = event.request.headers.get('Authorization');

	// 如果路径需要跳过缓存（优先判断）
	if (skipCachePaths.some(path => url.pathname.includes(path))) {
		console.log(`%c${logMessage} - 跳过缓存（指定跳过路径）`, 'color: #607d8b;'); // 蓝灰色
		return;
	}

	// 如果 Cache-Control 为 no-store 或 Pragma 为 no-cache，跳过缓存
	if ((cacheControl && cacheControl.includes('no-store')) || pragma === 'no-cache' || authorization) {
		console.log(`%c${logMessage} - 跳过缓存（no-store/no-cache 或 Authorization 头）`, 'color: #795548;'); // 棕色
		return;
	}

	// 如果路径需要缓存（无论请求方法）
	if (cachePaths.some(path => url.pathname.includes(path))) {
		console.log(`%c${logMessage} - 缓存请求（指定缓存路径）`, 'color: #4caf50;'); // 绿色
		event.respondWith(
			fetch(event.request).then((response) => {
				// 克隆响应，因为响应只能读取一次
				const responseClone = response.clone();
				
				// 缓存响应
				caches.open('dynamic-cache').then((cache) => {
					cache.put(event.request, responseClone).then(() => {
						console.log(`%c${logMessage} - 缓存完成`, 'color: #4caf50;'); // 绿色
					});
				});
				return response;
			}).catch(() => {
				console.log(`%c${logMessage} - 网络失败`, 'color: #d32f2f;'); // 深红色
			})
		);
		return; // 跳过后续的处理
	}

	// 对于非缓存请求且方法为 GET，采用缓存策略
	if (event.request.method === 'GET') {
		event.respondWith(
			caches.match(event.request).then((cachedResponse) => {
				// 如果缓存命中，返回缓存数据
				if (cachedResponse) {
					console.log(`%c${logMessage} - 缓存命中`, 'color: #ff9800;'); // 橙色
					// 在后台更新缓存
					event.waitUntil(
						fetch(event.request).then((networkResponse) => {
							return caches.open('dynamic-cache').then((cache) => {
								cache.put(event.request, networkResponse.clone());
							});
						})
					);
					return cachedResponse;
				}

				// 如果缓存未命中，则发起网络请求
				console.log(`%c${logMessage} - 网络请求`, 'color: #3f51b5;'); // 靛蓝色
				return fetch(event.request).then((response) => {
					// 克隆响应并缓存
					const responseClone = response.clone();
					caches.open('dynamic-cache').then((cache) => {
						cache.put(event.request, responseClone).then(() => {
							console.log(`%c${logMessage} - 缓存完成`, 'color: #4caf50;'); // 绿色
						});
					});
					return response;
				}).catch(() => {
					console.log(`%c${logMessage} - 网络失败`, 'color: #d32f2f;'); // 深红色
				});
			})
		);
	} else {
		console.log(`%c${logMessage} - 跳过缓存`, 'color: #607d8b;'); // 蓝灰色
	}
});
