/**
 * Service Worker 配置文件 
 * 实现了渐进式Web应用的离线缓存能力
 * 采用 Stale-While-Revalidate 策略:
 * 1. 优先使用缓存响应
 * 2. 同时在后台发起网络请求更新缓存
 * 3. 下次请求时使用更新后的缓存
 */

// 日志颜色配置 - 使用七种主要颜色标识不同类型的操作
const LOG_COLORS = {
    SUCCESS: '#4caf50', // 成功操作 - 绿色（缓存命中、更新成功）
    INFO: '#2196f3',    // 普通信息 - 蓝色（网络请求、一般信息）
    WARN: '#ff9800',    // 警告信息 - 橙色（缓存更新失败）
    ERROR: '#f44336',   // 错误信息 - 红色（请求失败、严重错误）
    SKIP: '#757575',    // 跳过操作 - 灰色（跳过缓存的请求）
    UPDATE: '#00bcd4',  // 更新操作 - 青色（缓存更新操作）
    LIFECYCLE: '#9c27b0' // 生命周期 - 紫色（安装、激活事件）
};

// 定义需要缓存的路径
const cachePaths = [
    '/_avatars', // 用户头像等静态资源
    '/_assets', // JS、CSS等基础资源
    '/_private-user-images', // 用户上传的图片
    '/_camo', // 代理过的外部资源
    '/_raw' // 大文件等原始资源
];

/**
 * 检查是否为静态资源
 * @param {string} pathname - URL 路径
 * @returns {boolean} 是否为静态资源
 */
const isStaticResource = (pathname) => {
    // 定义静态资源的文件扩展名
    const staticExtensions = [
        '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', 
        '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot'
    ];
    return staticExtensions.some(ext => pathname.toLowerCase().endsWith(ext));
};

/**
 * 格式化日志输出
 * @param {string} message - 日志消息
 * @param {string} color - 日志颜色代码
 * @param {string} type - 日志类型标识
 */
const log = (message, color, type = '') => {
    const prefix = type ? `[${type}] ` : '';
    console.log(`%c${prefix}${message}`, `color: ${color}; font-weight: bold;`);
};

/**
 * 检查请求是否应该跳过缓存
 * @param {Request} request - 请求对象
 * @param {URL} url - 解析后的URL对象
 * @returns {Object} 包含是否跳过的布尔值和具体原因
 */
const shouldSkipCache = (request, url) => {
    // 如果不是 GET 请求，跳过缓存
    if (request.method !== 'GET') {
        return {
            skip: true,
            reason: '非 GET 请求不缓存'
        };
    }

    // 检查 URL 是否包含在 cachePaths 中
    if (!cachePaths.some(path => url.pathname.startsWith(path))) {
        return {
            skip: true,
            reason: '路径不在缓存列表中'
        };
    }

    // 如果不是静态资源，跳过缓存
    if (!isStaticResource(url.pathname)) {
        return {
            skip: true,
            reason: '非静态资源不缓存'
        };
    }

    // 跳过浏览器扩展请求
    if (url.protocol === 'chrome-extension:') {
        return {
            skip: true,
            reason: '浏览器扩展请求不缓存'
        };
    }

    // 检查缓存控制头
    const cacheControl = request.headers.get('Cache-Control');
    const pragma = request.headers.get('Pragma');
    if ((cacheControl && cacheControl.includes('no-store')) || pragma === 'no-cache') {
        return {
            skip: true,
            reason: '请求头指定不进行缓存'
        };
    }

    // 跳过带有认证信息的请求
    if (request.headers.get('Authorization')) {
        return {
            skip: true,
            reason: '带有认证信息的请求不缓存'
        };
    }

    return {
        skip: false,
        reason: ''
    };
};

/**
 * 更新缓存
 * @param {Request} request - 请求对象
 * @param {Response} response - 响应对象
 * @param {string} logMessage - 日志信息前缀
 */
const updateCache = async (request, response, logMessage) => {
    // 检查响应的有效性
    if (!response || response.status !== 200 || response.type !== 'basic') {
        log(`${logMessage} - 响应不满足缓存条件: status=${response?.status}, type=${response?.type}`, LOG_COLORS.SKIP);
        return response;
    }

    try {
        // 打开缓存并存储响应
        const cache = await caches.open('static-cache');
        const responseClone = response.clone();
        await cache.put(request, responseClone);
        log(`${logMessage} - 缓存已更新`, LOG_COLORS.UPDATE);
    } catch (error) {
        log(`${logMessage} - 缓存更新失败: ${error.message}`, LOG_COLORS.ERROR);
    }

    return response;
};

// Service Worker 安装事件 - 首次安装或更新时触发
self.addEventListener('install', (event) => {
    log('Service Worker 安装完成', LOG_COLORS.LIFECYCLE, 'Install');
    self.skipWaiting(); // 跳过等待状态，直接激活
});

// Service Worker 激活事件 - 激活后开始接管页面请求
self.addEventListener('activate', (event) => {
    log('Service Worker 激活完成', LOG_COLORS.LIFECYCLE, 'Activate');
    self.clients.claim(); // 立即接管所有页面
});

// Service Worker 请求拦截处理
self.addEventListener('fetch', (event) => {
    // 验证请求的有效性
    if (!event.request?.url) {
        log('请求无效', LOG_COLORS.ERROR);
        return;
    }

    const url = new URL(event.request.url);
    const logMessage = `${event.request.method} ${url.pathname}`;

    // 检查是否需要跳过缓存
    const skipCheck = shouldSkipCache(event.request, url);
    if (skipCheck.skip) {
        log(`${logMessage} - 跳过缓存: ${skipCheck.reason}`, LOG_COLORS.SKIP);
        return;
    }

    event.respondWith((async () => {
        try {
            // 优先尝试从缓存获取响应
            const cachedResponse = await caches.match(event.request);
            if (cachedResponse) {
                log(`${logMessage} - 返回缓存的响应`, LOG_COLORS.SUCCESS);

                // 后台更新缓存（Stale-While-Revalidate 策略）
                event.waitUntil(
                    fetch(event.request)
                    .then(response => updateCache(event.request, response, logMessage))
                    .catch(error => log(`${logMessage} - 后台更新失败: ${error.message}`,
                        LOG_COLORS.WARN))
                );
                return cachedResponse;
            }

            // 缓存未命中，发起网络请求
            log(`${logMessage} - 发起网络请求`, LOG_COLORS.INFO);
            const networkResponse = await fetch(event.request);
            // 缓存网络响应
            await updateCache(event.request, networkResponse, logMessage);
            return networkResponse;

        } catch (error) {
            log(`${logMessage} - 请求处理失败: ${error.message}`, LOG_COLORS.ERROR);
            // 返回错误响应
            return new Response('网络请求失败', {
                status: 408,
                statusText: 'Request Timeout',
                headers: new Headers({
                    'Content-Type': 'text/plain; charset=utf-8'
                })
            });
        }
    })());
});
