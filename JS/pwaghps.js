/**
 * Service Worker 配置文件
 * 用于实现请求的缓存策略和控制
 * 包含了详细的日志输出，方便调试和监控
 */

// 日志颜色配置
const LOG_COLORS = {
    INFO: '#2196f3',    // 普通信息 - 蓝色
    WARN: '#ff9800',    // 警告信息 - 橙色
    ERROR: '#f44336',   // 错误信息 - 红色
    DEBUG: '#757575'    // 调试信息 - 灰色
};

/**
 * 缓存配置
 * 包含必须缓存的资源路径和禁止缓存的路径
 */
const CACHE_CONFIG = {
    // 必须缓存的路径 - 这些路径下的资源无论请求方法如何都会被缓存
    cachePaths: [
        '/_avatars',           // 用户头像资源
        '/_assets',            // 静态资源文件
        '/_private-user-images', // 用户上传的私有图片
        '/_camo',              // 代理的外部资源
        '/_raw'                // 原始资源文件
    ],
    // 禁止缓存的路径 - 这些路径下的资源永远不会被缓存
    skipPaths: [
        '/login',              // 登录路径
        '/sessions'            // 会话路径
    ]
};

/**
 * 日志输出函数
 * @param {string} message - 日志消息
 * @param {string} color - 日志颜色代码
 * @param {string} type - 日志类型
 */
const log = (message, color, type = '') => {
    const prefix = type ? `[${type}] ` : '';
    console.log(`%c${prefix}${message}`, `color: ${color}`);
};

/**
 * 检查请求是否应该跳过缓存
 * @param {Request} request - 请求对象
 * @param {URL} url - URL对象
 * @returns {Object} 包含是否跳过的布尔值和跳过原因
 */
const shouldSkipCache = (request, url) => {
    // 检查是否是浏览器扩展请求
    if (url.protocol === 'chrome-extension:') {
        return { skip: true, reason: '浏览器扩展请求' };
    }

    // 检查是否在跳过缓存的路径列表中
    if (CACHE_CONFIG.skipPaths.some(path => url.pathname.includes(path))) {
        return { skip: true, reason: '安全敏感路径' };
    }

    // 检查缓存控制头
    const cacheControl = request.headers.get('Cache-Control');
    const pragma = request.headers.get('Pragma');
    if ((cacheControl && cacheControl.includes('no-store')) || pragma === 'no-cache') {
        return { skip: true, reason: '请求头指定不缓存' };
    }

    // 检查是否包含授权头
    if (request.headers.get('Authorization')) {
        return { skip: true, reason: '包含授权信息' };
    }

    return { skip: false, reason: '' };
};

/**
 * 更新缓存
 * @param {Request} request - 请求对象
 * @param {Response} response - 响应对象
 * @param {string} logMessage - 日志前缀
 */
const updateCache = async (request, response, logMessage) => {
    // 检查响应是否有效且可缓存
    if (!response || response.status !== 200 || response.type !== 'basic') {
        log(`${logMessage} - 响应不满足缓存条件: status=${response?.status}, type=${response?.type}`, LOG_COLORS.DEBUG);
        return response;
    }

    try {
        const cache = await caches.open('dynamic-cache');
        const responseClone = response.clone();
        await cache.put(request, responseClone);
        log(`${logMessage} - 已更新缓存`, LOG_COLORS.INFO);
    } catch (error) {
        log(`${logMessage} - 缓存更新失败: ${error.message}`, LOG_COLORS.ERROR);
    }

    return response;
};

// Service Worker 安装事件处理
self.addEventListener('install', (event) => {
    log('Service Worker 安装完成', LOG_COLORS.INFO, 'Install');
    self.skipWaiting(); // 跳过等待，立即激活
});

// Service Worker 激活事件处理
self.addEventListener('activate', (event) => {
    log('Service Worker 激活完成', LOG_COLORS.INFO, 'Activate');
    self.clients.claim(); // 取得控制权
});

// Service Worker 请求拦截处理
self.addEventListener('fetch', (event) => {
    // 验证请求有效性
    if (!event.request?.url) {
        log('无效请求', LOG_COLORS.ERROR);
        return;
    }

    const url = new URL(event.request.url);
    const logMessage = `${event.request.method} ${url.pathname}`;

    // 检查是否需要跳过缓存
    const skipCheck = shouldSkipCache(event.request, url);
    if (skipCheck.skip) {
        log(`${logMessage} - 跳过缓存: ${skipCheck.reason}`, LOG_COLORS.DEBUG);
        return;
    }

    // 检查是否需要缓存（满足缓存路径或是GET请求）
    const shouldCache = CACHE_CONFIG.cachePaths.some(path => url.pathname.includes(path)) || 
                       event.request.method === 'GET';

    if (shouldCache) {
        event.respondWith((async () => {
            try {
                // 尝试从缓存获取响应
                const cachedResponse = await caches.match(event.request);
                if (cachedResponse) {
                    log(`${logMessage} - 使用缓存响应`, LOG_COLORS.INFO);
                    
                    // 在后台更新缓存
                    event.waitUntil(
                        fetch(event.request)
                            .then(response => updateCache(event.request, response, logMessage))
                            .catch(error => log(`${logMessage} - 后台更新失败: ${error.message}`, LOG_COLORS.WARN))
                    );
                    return cachedResponse;
                }

                // 发起网络请求
                log(`${logMessage} - 发起网络请求`, LOG_COLORS.INFO);
                const networkResponse = await fetch(event.request);
                await updateCache(event.request, networkResponse, logMessage);
                return networkResponse;

            } catch (error) {
                log(`${logMessage} - 请求处理失败: ${error.message}`, LOG_COLORS.ERROR);
                // 创建错误响应，注意 statusText 必须使用英文
                return new Response('网络请求失败', {
                    status: 408,
                    statusText: 'Request Timeout',
                    headers: new Headers({
                        'Content-Type': 'text/plain; charset=utf-8'
                    })
                });
            }
        })());
    } else {
        log(`${logMessage} - 跳过缓存: 非必缓存路径且非GET请求`, LOG_COLORS.DEBUG);
    }
});
