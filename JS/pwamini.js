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

// 拦截请求并缓存（Stale-While-Revalidate 策略）
self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url); // 获取请求的URL

	// 跳过 chrome-extension 协议的请求
	if (url.protocol === 'chrome-extension:') return;

	// 构建日志前缀
	const logMessage = `${event.request.method} ${url.pathname}`;

	// 获取请求头
	const cacheControl = event.request.headers.get('Cache-Control'); // 获取 Cache-Control 请求头
	const pragma = event.request.headers.get('Pragma'); // 获取 Pragma 请求头
	const authorization = event.request.headers.get('Authorization'); // 获取 Authorization 请求头

	// 1. 如果 Cache-Control 中包含 no-store 或 Pragma 中包含 no-cache，跳过缓存
	if ((cacheControl && cacheControl.includes('no-store')) || pragma === 'no-cache') {
		console.log(`%c${logMessage} - 跳过缓存（no-store/no-cache）`, 'color: #9c27b0;'); // 紫色
		return;
	}

	// 2. 如果请求中包含 Authorization 头，跳过缓存
	if (authorization) {
		console.log(`%c${logMessage} - 跳过缓存（Authorization 头）`, 'color: #795548;'); // 棕色
		return;
	}

	// 定义需要跳过缓存的路径
	const cachePaths = [
		'/_avatars',
		'/_assets',
		'/_private-user-images',
		'/_camo',
		'/_raw',
		'/login',
		'/sessions',
	];

	// 3. 跳过指定路径的请求
	if (skipCachePaths.some(path => url.pathname.includes(path))) {
		console.log(`%c${logMessage} - 跳过缓存（指定路径）`, 'color: #607d8b;'); // 蓝灰色
		return;
	}

	// 4. 只缓存非 API 请求，且请求方式为 GET
	if (event.request.method === 'GET') {
		event.respondWith(
			caches.match(event.request).then((cachedResponse) => {
				if (cachedResponse) {
					console.log(`%c${logMessage} - 缓存命中`, 'color: #ff9800;'); // 橙色
					// 在后台更新缓存
					event.waitUntil(
						fetch(event.request).then((networkResponse) => {
							return caches.open('dynamic-cache').then((cache) => {
								cache.put(event.request, networkResponse.clone()).then(
									() => {
										console.log(`%c${logMessage} - 缓存已更新`,
											'color: #00bcd4;'); // 青色
									});
							});
						}).catch((error) => {
							console.log(`%c${logMessage} - 缓存更新失败`, 'color: #f44336;'); // 红色
						})
					);
					return cachedResponse;
				}

				// 如果缓存中没有，进行网络请求
				console.log(`%c${logMessage} - 网络请求`, 'color: #3f51b5;'); // 靛蓝色
				return fetch(event.request).then((response) => {
					// 克隆响应，因为响应只能读取一次
					const responseClone = response.clone();

					// 缓存新响应
					caches.open('dynamic-cache').then((cache) => {
						cache.put(event.request, responseClone).then(() => {
							console.log(`%c${logMessage} - 缓存完成`,
								'color: #4caf50;'); // 绿色
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
