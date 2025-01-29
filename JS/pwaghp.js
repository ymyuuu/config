// 安装阶段
self.addEventListener('install', (event) => {
  console.log('%c[Service Worker] 安装完成', 'color: #4caf50; font-weight: bold;');
  self.skipWaiting();
});

// 激活阶段
self.addEventListener('activate', (event) => {
  console.log('%c[Service Worker] 激活完成', 'color: #2196f3; font-weight: bold;');
  self.clients.claim();
});

// 拦截请求并缓存（Stale-While-Revalidate 策略）
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.protocol === 'chrome-extension:') return;

  const logMessage = `${event.request.method} ${url.pathname}`;

  // 定义需要缓存的路径
  const cachePaths = [
    '/_avatars',
    '/_assets',
    '/_private-user-images',
    '/_camo',
    '/_raw'
  ];

  // 定义需要优先跳过的路径
  const skipCachePaths = [
    '/api',       // API 请求
    '/auth',      // 认证请求
    '/admin',     // 管理后台
    '/login',     // 登录
    '/logout',    // 登出
    '/sessions'   // 会话路径
  ];

  // 1. 优先跳过指定路径
  if (skipCachePaths.some(path => url.pathname.includes(path))) {
    console.log(`%c${logMessage} - 跳过缓存（指定路径）`, 'color: #607d8b;');
    return;
  }

  // 2. 处理需要缓存的路径（仅GET请求）
  if (event.request.method === 'GET' && 
      cachePaths.some(path => url.pathname.includes(path))) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        // 立即返回缓存响应
        if (cachedResponse) {
          console.log(`%c${logMessage} - 缓存命中（强制路径）`, 'color: #ff9800;');
          // 后台更新缓存
          event.waitUntil(
            fetch(event.request).then(networkResponse => {
              return caches.open('dynamic-cache').then(cache => {
                cache.put(event.request, networkResponse.clone());
                console.log(`%c${logMessage} - 强制路径缓存更新`, 'color: #00bcd4;`);
              });
            }).catch(error => {
              console.log(`%c${logMessage} - 强制路径缓存更新失败`, 'color: #f44336;`);
            })
          );
          return cachedResponse;
        }

        // 没有缓存则请求网络
        return fetch(event.request).then(networkResponse => {
          const responseClone = networkResponse.clone();
          caches.open('dynamic-cache').then(cache => {
            cache.put(event.request, responseClone);
            console.log(`%c${logMessage} - 强制路径缓存完成`, 'color: #4caf50;`);
          });
          return networkResponse;
        }).catch(error => {
          console.log(`%c${logMessage} - 网络失败（强制路径）`, 'color: #d32f2f;');
          return new Response('网络错误', { status: 503 });
        });
      })
    );
    return;
  }

  // 3. 常规缓存检查
  const cacheControl = event.request.headers.get('Cache-Control');
  const pragma = event.request.headers.get('Pragma');
  const authorization = event.request.headers.get('Authorization');

  if ((cacheControl?.includes('no-store')) || pragma === 'no-cache') {
    console.log(`%c${logMessage} - 跳过缓存（no-store/no-cache）`, 'color: #9c27b0;');
    return;
  }

  if (authorization) {
    console.log(`%c${logMessage} - 跳过缓存（Authorization头）`, 'color: #795548;');
    return;
  }

  // 4. 处理其他GET请求
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        // Stale-While-Revalidate 逻辑
        const fetchPromise = fetch(event.request).then(networkResponse => {
          const responseClone = networkResponse.clone();
          caches.open('dynamic-cache').then(cache => {
            cache.put(event.request, responseClone);
            console.log(`%c${logMessage} - 缓存更新完成`, 'color: #00bcd4;`);
          });
          return networkResponse;
        });

        return cachedResponse || fetchPromise;
      })
    );
  } else {
    console.log(`%c${logMessage} - 跳过非GET请求`, 'color: #607d8b;');
  }
});
