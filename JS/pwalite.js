// 安装阶段
self.addEventListener('install', (event) => {
	self.skipWaiting(); // 立即激活
	console.log('[Service Worker] 安装完成');
});

// 激活阶段
self.addEventListener('activate', (event) => {
	self.clients.claim(); // 取得控制权
	console.log('[Service Worker] 激活完成');
});

// 拦截请求并缓存
self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);

	// 只处理以 "/_assets" 开头的 GET 请求
	if (event.request.method === 'GET' && url.pathname.startsWith('/_assets')) {
		event.respondWith(
			caches.match(event.request).then((cachedResponse) => {
				// 如果缓存命中，返回缓存
				if (cachedResponse) {
					console.log(`[Service Worker] 缓存命中: ${url.pathname}`);
					return cachedResponse;
				}

				// 否则，进行网络请求并缓存
				console.log(`[Service Worker] 缓存缺失，进行网络请求: ${url.pathname}`);
				return fetch(event.request).then((response) => {
					const responseClone = response.clone();
					caches.open('dynamic-cache').then((cache) => {
						cache.put(event.request, responseClone);
						console.log(`[Service Worker] 缓存已更新: ${url.pathname}`);
					});
					return response;
				}).catch((error) => {
					console.error(`[Service Worker] 网络请求失败: ${url.pathname}`, error);
				});
			})
		);
	}
});
