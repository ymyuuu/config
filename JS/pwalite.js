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

// 静态文件扩展名列表
const staticFileExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf', '.eot'];

// 判断是否为静态资源
function isStaticResource(url) {
	return staticFileExtensions.some((ext) => url.pathname.endsWith(ext));
}

// 拦截请求并缓存
self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url); // 获取请求的 URL

	// 跳过 chrome-extension 协议的请求
	if (url.protocol === 'chrome-extension:') return;

	// 构建日志前缀
	const logMessage = `${event.request.method} ${url.pathname}`;

	// 判断是否需要缓存
	const shouldCache = url.pathname.startsWith('/_assets') || isStaticResource(url);

	if (!shouldCache) {
		// 不符合缓存条件的请求
		console.log(`%c跳过缓存: ${logMessage}`, 'color: #607d8b;'); // 蓝灰色
		return;
	}

	// 处理 GET 请求
	if (event.request.method === 'GET') {
		event.respondWith(
			caches.match(event.request).then((cachedResponse) => {
				if (cachedResponse) {
					// 缓存命中
					console.log(`%c缓存命中: ${logMessage}`, 'color: #ff9800;'); // 橙色
					// 后台更新缓存
					event.waitUntil(
						fetch(event.request).then((networkResponse) => {
							return caches.open('dynamic-cache').then((cache) => {
								cache.put(event.request, networkResponse.clone()).then(() => {
									console.log(`%c缓存已更新: ${logMessage}`, 'color: #00bcd4;'); // 青色
								});
							});
						}).catch(() => {
							console.log(`%c缓存更新失败: ${logMessage}`, 'color: #f44336;'); // 红色
						})
					);
					return cachedResponse;
				}

				// 缓存未命中，请求网络
				console.log(`%c网络请求: ${logMessage}`, 'color: #3f51b5;'); // 靛蓝色
				return fetch(event.request).then((response) => {
					// 克隆响应，因为响应只能读取一次
					const responseClone = response.clone();

					// 缓存新响应
					caches.open('dynamic-cache').then((cache) => {
						cache.put(event.request, responseClone).then(() => {
							console.log(`%c缓存完成: ${logMessage}`, 'color: #4caf50;'); // 绿色
						});
					});

					return response;
				}).catch(() => {
					console.log(`%c网络请求失败: ${logMessage}`, 'color: #d32f2f;'); // 深红色
				});
			})
		);
	} else {
		// 非 GET 请求跳过
		console.log(`%c跳过非 GET 请求: ${logMessage}`, 'color: #795548;'); // 棕色
	}
});
