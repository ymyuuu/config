// 定义常量，用于日志颜色配置
const LOG_COLORS = {
    SUCCESS: '#4caf50',    // 成功信息 - 绿色
    INFO: '#2196f3',       // 一般信息 - 蓝色
    WARN: '#ff9800',       // 警告信息 - 橙色
    ERROR: '#f44336',      // 错误信息 - 红色
    SKIP: '#607d8b',       // 跳过处理 - 蓝灰色
    UPDATE: '#00bcd4',     // 更新信息 - 青色
    NETWORK: '#3f51b5',    // 网络请求 - 靛蓝色
    CHECK: '#9c27b0'       // 检查信息 - 紫色
};

// 缓存配置，定义需要特殊处理的路径
const CACHE_CONFIG = {
    // 需要强制缓存的路径（无论请求方法是什么都会缓存）
    cachePaths: [
        '/_avatars',           // 用户头像资源
        '/_assets',            // 静态资源文件
        '/_private-user-images', // 用户私有图片
        '/_camo',              // 资源代理
        '/_raw'                // 原始资源文件
    ],
    // 优先级最高的跳过缓存路径
    skipPaths: [
        '/login',              // 登录相关路径
        '/sessions'            // 会话相关路径
    ]
};

/**
 * 格式化控制台日志输出
 * @param {string} message - 日志消息内容
 * @param {string} color - 日志颜色代码
 * @param {boolean} [isError=false] - 是否是错误日志
 */
const logWithColor = (message, color, isError = false) => {
    const style = `color: ${color}; font-weight: bold; font-size: 12px;`;
    if (isError) {
        console.error(`%c[Service Worker] ${message}`, style);
    } else {
        console.log(`%c[Service Worker] ${message}`, style);
    }
};

/**
 * 详细检查请求是否应该跳过缓存
 * @param {Request} request - 请求对象
 * @param {URL} url - 解析后的URL对象
 * @param {string} logMessage - 基础日志信息
 * @returns {boolean} 是否应该跳过缓存
 */
const shouldSkipCache = (request, url, logMessage) => {
    // 检查是否是浏览器扩展请求
    if (url.protocol === 'chrome-extension:') {
        logWithColor(`${logMessage} - 跳过缓存: 浏览器扩展请求`, LOG_COLORS.SKIP);
        return true;
    }

    // 检查是否在强制跳过路径列表中
    if (CACHE_CONFIG.skipPaths.some(path => url.pathname.includes(path))) {
        logWithColor(`${logMessage} - 跳过缓存: 匹配跳过路径 ${url.pathname}`, LOG_COLORS.SKIP);
        return true;
    }

    // 检查缓存控制头
    const cacheControl = request.headers.get('Cache-Control');
    const pragma = request.headers.get('Pragma');
    if (cacheControl && cacheControl.includes('no-store')) {
        logWithColor(`${logMessage} - 跳过缓存: Cache-Control: no-store`, LOG_COLORS.SKIP);
        return true;
    }
    if (pragma === 'no-cache') {
        logWithColor(`${logMessage} - 跳过缓存: Pragma: no-cache`, LOG_COLORS.SKIP);
        return true;
    }

    // 检查是否包含授权头
    const hasAuth = request.headers.get('Authorization');
    if (hasAuth) {
        logWithColor(`${logMessage} - 跳过缓存: 包含 Authorization 头`, LOG_COLORS.SKIP);
        return true;
    }

    return false;
};

/**
 * 处理缓存更新逻辑
 * @param {Request} request - 请求对象
 * @param {Response} response - 响应对象
 * @param {string} logMessage - 日志信息
 * @returns {Promise<Response>} 处理后的响应对象
 */
const updateCache = async (request, response, logMessage) => {
    // 检查响应是否有效且可缓存
    if (!response || response.status !== 200 || response.type !== 'basic') {
        logWithColor(
            `${logMessage} - 响应不可缓存: status=${response?.status}, type=${response?.type}`, 
            LOG_COLORS.WARN
        );
        return response;
    }

    try {
        // 打开缓存
        const cache = await caches.open('dynamic-cache');
        logWithColor(`${logMessage} - 开始更新缓存`, LOG_COLORS.CHECK);
        
        // 克隆响应并存入缓存
        await cache.put(request, response.clone());
        logWithColor(
            `${logMessage} - 缓存更新成功: ${request.url}`, 
            LOG_COLORS.SUCCESS
        );
    } catch (error) {
        logWithColor(
            `${logMessage} - 缓存更新失败: ${error.message}`, 
            LOG_COLORS.ERROR, 
            true
        );
    }
    
    return response;
};

/**
 * 检查是否需要缓存请求
 * @param {URL} url - URL对象
 * @param {string} method - 请求方法
 * @param {string} logMessage - 日志信息
 * @returns {boolean} 是否需要缓存
 */
const shouldCacheRequest = (url, method, logMessage) => {
    // 检查是否在强制缓存路径中
    const isInCachePaths = CACHE_CONFIG.cachePaths.some(path => url.pathname.includes(path));
    if (isInCachePaths) {
        logWithColor(`${logMessage} - 强制缓存路径: ${url.pathname}`, LOG_COLORS.CHECK);
        return true;
    }

    // 检查是否是GET请求
    if (method === 'GET') {
        logWithColor(`${logMessage} - GET请求自动缓存`, LOG_COLORS.CHECK);
        return true;
    }

    logWithColor(
        `${logMessage} - 不满足缓存条件: 非GET请求且不在缓存路径中`, 
        LOG_COLORS.SKIP
    );
    return false;
};

// Service Worker 安装事件处理
self.addEventListener('install', (event) => {
    logWithColor('安装完成 - 准备接管请求', LOG_COLORS.SUCCESS);
    self.skipWaiting(); // 跳过等待，立即激活
});

// Service Worker 激活事件处理
self.addEventListener('activate', (event) => {
    logWithColor('激活完成 - 开始接管请求', LOG_COLORS.SUCCESS);
    self.clients.claim(); // 取得控制权
});

// Service Worker 请求拦截处理
self.addEventListener('fetch', (event) => {
    // 检查请求是否有效
    if (!event.request?.url) {
        logWithColor('无效请求 - 跳过处理', LOG_COLORS.ERROR, true);
        return;
    }

    const url = new URL(event.request.url);
    const logMessage = `${event.request.method} ${url.pathname}`;
    
    logWithColor(`开始处理请求: ${logMessage}`, LOG_COLORS.INFO);

    // 检查是否需要跳过缓存
    if (shouldSkipCache(event.request, url, logMessage)) {
        return;
    }

    // 检查是否需要缓存
    if (shouldCacheRequest(url, event.request.method, logMessage)) {
        event.respondWith((async () => {
            try {
                // 尝试从缓存中获取响应
                const cachedResponse = await caches.match(event.request);
                if (cachedResponse) {
                    logWithColor(
                        `${logMessage} - 缓存命中，返回缓存内容`, 
                        LOG_COLORS.SUCCESS
                    );
                    
                    // 在后台更新缓存
                    event.waitUntil(
                        fetch(event.request)
                            .then(response => updateCache(event.request, response, logMessage))
                            .catch(error => {
                                logWithColor(
                                    `${logMessage} - 后台更新失败: ${error.message}`, 
                                    LOG_COLORS.ERROR,
                                    true
                                );
                            })
                    );
                    
                    return cachedResponse;
                }

                // 缓存未命中，发起网络请求
                logWithColor(`${logMessage} - 缓存未命中，发起网络请求`, LOG_COLORS.NETWORK);
                const networkResponse = await fetch(event.request);
                
                // 更新缓存
                await updateCache(event.request, networkResponse.clone(), logMessage);
                return networkResponse;

            } catch (error) {
                logWithColor(
                    `${logMessage} - 请求处理失败: ${error.message}`, 
                    LOG_COLORS.ERROR,
                    true
                );
                
                // 返回错误响应
                return new Response(
                    `请求失败: ${error.message}`, 
                    {
                        status: 408,
                        statusText: 'Request Failed',
                        headers: new Headers({
                            'Content-Type': 'text/plain',
                            'X-SW-Error': error.message
                        })
                    }
                );
            }
        })());
    }
});
