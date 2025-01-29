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

// 需要缓存的路径前缀
const cachePaths = [
	'/_avatars',
	'/_assets',
	'/_private-user-images',
	'/_camo',
	'/_raw',
	'/login',
	'/sessions',
];

// 判断是否为需要缓存的路径
function shouldCachePath(url) {
	return cachePaths.some((path) => url.pathname.startsWith(path));
}

// 拦截请求并缓存
self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url); // 获取请求的 URL

	// 跳过 chrome-extension 协议的请求
	if (url.protocol === 'chrome-extension:') return;

	// 构建日志前缀
	const logMessage = `${event.request.method} ${url.pathname}`;

	// 检查路径是否需要缓存
	if (!shouldCachePath(url)) {
		console.log(`%c跳过缓存: ${logMessage}`, 'color: #607d8b;'); // 蓝灰色
		return;
	}

	// 处理需要缓存的请求
	event.respondWith(
		caches.match(event.request).then((cachedResponse) => {
			if (cachedResponse) {
				// 缓存命中
				console.log(`%c缓存命中: ${logMessage}`, 'color: #ff9800;'); // 橙色
				// 后台更新缓存
				event.waitUntil(
					fetch(event.request).then((networkResponse) => {
						return caches.open('dynamic-cache').then((cache) => {
							cache.put(event.request, networkResponse.clone()).then(
								() => {
									console.log(`%c缓存已更新: ${logMessage}`,
										'color: #00bcd4;'); // 青色
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
				const responseClone = response.clone();

				// 缓存新响应
				caches.open('dynamic-cache').then((cache) => {
					cache.put(event.request, responseClone).then(() => {
						console.log(`%c缓存完成: ${logMessage}`,
							'color: #4caf50;'); // 绿色
					});
				});

				return response;
			}).catch(() => {
				console.log(`%c网络请求失败: ${logMessage}`, 'color: #d32f2f;'); // 深红色
			});
		})
	);
});
