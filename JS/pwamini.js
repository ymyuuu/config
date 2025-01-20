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

// 拦截请求并缓存（仅缓存以 /_assets 为前缀的路径）
self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url); // 获取请求的URL

	// 跳过非 /_assets 路径
	if (!url.pathname.startsWith('/_assets')) {
		console.log(`%c跳过缓存: ${event.request.method} ${url.pathname}`, 'color: #607d8b;'); // 蓝灰色
		return;
	}

	// 仅处理 GET 请求
	if (event.request.method === 'GET') {
		event.respondWith(
			caches.match(event.request).then((cachedResponse) => {
				if (cachedResponse) {
					console.log(`%c缓存命中: ${url.pathname}`, 'color: #ff9800;'); // 橙色
					// 后台更新缓存
					event.waitUntil(
						fetch(event.request).then((networkResponse) => {
							return caches.open('dynamic-cache').then((cache) => {
								cache.put(event.request, networkResponse.clone()).then(() => {
									console.log(`%c缓存已更新: ${url.pathname}`, 'color: #00bcd4;'); // 青色
								});
							});
						}).catch(() => {
							console.log(`%c缓存更新失败: ${url.pathname}`, 'color: #f44336;'); // 红色
						})
					);
					return cachedResponse;
				}

				// 缓存中没有，执行网络请求并缓存
				console.log(`%c网络请求: ${url.pathname}`, 'color: #3f51b5;'); // 靛蓝色
				return fetch(event.request).then((response) => {
					const responseClone = response.clone();
					caches.open('dynamic-cache').then((cache) => {
						cache.put(event.request, responseClone).then(() => {
							console.log(`%c缓存完成: ${url.pathname}`, 'color: #4caf50;'); // 绿色
						});
					});
					return response;
				}).catch(() => {
					console.log(`%c网络请求失败: ${url.pathname}`, 'color: #d32f2f;'); // 深红色
				});
			})
		);
	} else {
		console.log(`%c跳过非 GET 请求: ${url.pathname}`, 'color: #607d8b;'); // 蓝灰色
	}
});
