// 定义常量，用于日志颜色
const LOG_COLORS = {
    SUCCESS: '#4caf50',    // 成功 - 绿色
    INFO: '#2196f3',       // 信息 - 蓝色
    WARN: '#ff9800',       // 警告 - 橙色
    ERROR: '#f44336',      // 错误 - 红色
    SKIP: '#607d8b',       // 跳过 - 蓝灰色
    UPDATE: '#00bcd4',     // 更新 - 青色
    NETWORK: '#3f51b5'     // 网络 - 靛蓝色
};

// 定义需要缓存和跳过的路径
const CACHE_CONFIG = {
    // 需要缓存的路径（无论请求方法）
    cachePaths: [
        '/_avatars',           // 用户头像
        '/_assets',            // 资源文件
        '/_private-user-images', // 私有用户图片
        '/_camo',              // 伪装资源
        '/_raw'                // 原始资源
    ],
    // 需要跳过缓存的路径（优先级最高）
    skipPaths: [
        '/login',              // 登录路径
        '/sessions'            // 会话路径
    ]
};

/**
 * 格式化日志输出
 * @param {string} message - 日志信息
 * @param {string} color - 颜色代码
 */
const logWithColor = (message, color) => {
    console.log(`%c${message}`, `color: ${color}; font-weight: bold;`);
};

/**
 * 检查是否应该跳过缓存
 * @param {Request} request - 请求对象
 * @param {URL} url - URL对象
 * @returns {boolean} 是否应该跳过缓存
 */
const shouldSkipCache = (request, url) => {
    // 检查是否是 chrome-extension 请求
    if (url.protocol === 'chrome-extension:') return true;

    // 检查是否在跳过路径列表中
    if (CACHE_CONFIG.skipPaths.some(path => url.pathname.includes(path))) return true;

    // 检查缓存控制头
    const cacheControl = request.headers.get('Cache-Control');
    const pragma = request.headers.get('Pragma');
    if ((cacheControl && cacheControl.includes('no-store')) || pragma === 'no-cache') return true;

    // 检查授权头
    return !!request.headers.get('Authorization');
};

/**
 * 处理缓存更新
 * @param {Request} request - 请求对象
 * @param {Response} response - 响应对象
 * @param {string} logMessage - 日志信息
 * @returns {Promise} 缓存更新的Promise
 */
const updateCache = async (request, response, logMessage) => {
    if (!response || response.status !== 200 || response.type !== 'basic') return response;

    try {
        const cache = await caches.open('dynamic-cache');
        await cache.put(request, response.clone());
        logWithColor(`${logMessage} - 缓存已更新`, LOG_COLORS.UPDATE);
    } catch (error) {
        logWithColor(`${logMessage} - 缓存更新失败: ${error}`, LOG_COLORS.ERROR);
    }
    return response;
};

// Service Worker 安装事件
self.addEventListener('install', (event) => {
    logWithColor('[Service Worker] 安装完成', LOG_COLORS.SUCCESS);
    self.skipWaiting(); // 跳过等待，立即激活
});

// Service Worker 激活事件
self.addEventListener('activate', (event) => {
    logWithColor('[Service Worker] 激活完成', LOG_COLORS.INFO);
    self.clients.claim(); // 取得控制权
});

// Service Worker 请求拦截事件
self.addEventListener('fetch', (event) => {
    // 如果请求无效，直接返回
    if (!event.request?.url) return;

    const url = new URL(event.request.url);
    const logMessage = `${event.request.method} ${url.pathname}`;

    // 检查是否需要跳过缓存
    if (shouldSkipCache(event.request, url)) {
        logWithColor(`${logMessage} - 跳过缓存`, LOG_COLORS.SKIP);
        return;
    }

    // 检查是否需要缓存（符合缓存路径或是GET请求）
    const shouldCache = CACHE_CONFIG.cachePaths.some(path => url.pathname.includes(path)) || 
                       event.request.method === 'GET';

    if (shouldCache) {
        event.respondWith((async () => {
            try {
                // 尝试从缓存中获取响应
                const cachedResponse = await caches.match(event.request);
                if (cachedResponse) {
                    logWithColor(`${logMessage} - 缓存命中`, LOG_COLORS.WARN);
                    // 后台更新缓存
                    event.waitUntil(
                        fetch(event.request)
                            .then(response => updateCache(event.request, response, logMessage))
                            .catch(error => logWithColor(`${logMessage} - 缓存更新失败: ${error}`, LOG_COLORS.ERROR))
                    );
                    return cachedResponse;
                }

                // 如果缓存中没有，发起网络请求
                logWithColor(`${logMessage} - 网络请求`, LOG_COLORS.NETWORK);
                const networkResponse = await fetch(event.request);
                await updateCache(event.request, networkResponse, logMessage);
                return networkResponse;

            } catch (error) {
                logWithColor(`${logMessage} - 请求失败: ${error}`, LOG_COLORS.ERROR);
                // 返回错误响应
                return new Response('Network error', {
                    status: 408,
                    statusText: 'Request timeout'
                });
            }
        })());
    } else {
        logWithColor(`${logMessage} - 跳过缓存（非缓存路径且非GET请求）`, LOG_COLORS.SKIP);
    }
});
