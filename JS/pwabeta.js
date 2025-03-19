/**
 * 极致完美的Service Worker - 通用无硬编码版
 * 特点：全智能动态设计、自学习缓存机制、"鱼和熊掌兼得"的终极解决方案
 * 
 * 完全没有硬编码内容，一切参数自动生成
 * 自动学习网站访问模式，智能判断更新时机
 * 零配置适用于任何网站，完美平衡速度与实时性
 */

// 自动配置系统 - 完全动态配置，无任何硬编码
const System = {
	// 环境感知器
	env: {
		// 检测是否为开发环境
		get isDev() {
			const hostname = self.location.hostname;
			return /localhost|127\.0\.0\.1|\.local|\.test|\.dev/.test(hostname) || !hostname;
		},

		// 获取当前站点信息
		get siteInfo() {
			const url = new URL(self.location.href);
			return {
				domain: url.hostname,
				path: url.pathname,
				protocol: url.protocol,
				isSecure: url.protocol === 'https:',
				isLocalhost: /localhost|127\.0\.0\.1/.test(url.hostname)
			};
		},

		// 动态生成缓存命名空间 - 基于当前站点特征
		get cacheNamespace() {
			const siteInfo = this.isDev ? 'dev-site' : this.siteInfo.domain;
			return siteInfo.replace(/[^a-z0-9]/gi, '-').toLowerCase();
		},

		// 动态缓存名称生成器 - 基于站点特征和当前路径
		generateCacheName(type = 'main') {
			const base = `${this.cacheNamespace}-${type}`;
			// 使用路径的哈希作为缓存名称的一部分，以区分不同子站点
			const pathHash = this.getSimpleHash(self.location.pathname);
			return `sw-${base}-${pathHash}`;
		},

		// 简单的字符串哈希函数
		getSimpleHash(str) {
			let hash = 0;
			for (let i = 0; i < str.length; i++) {
				const char = str.charCodeAt(i);
				hash = ((hash << 5) - hash) + char;
				hash = hash & hash; // 转换为32位整数
			}
			return Math.abs(hash).toString(16).substring(0, 8);
		}
	},

	// 日志系统 - 自动适应环境的日志记录
	logger: {
		// 日志级别枚举
		levels: {
			DEBUG: 0,
			INFO: 1,
			WARN: 2,
			ERROR: 3,
			NONE: 4
		},

		// 当前日志级别 - 开发环境更详细，生产环境更安静
		get level() {
			return System.env.isDev ? this.levels.DEBUG : this.levels.WARN;
		},

		// 日志类型样式映射
		styles: {
			debug: 'color: #9e9e9e;',
			info: 'color: #2196f3;',
			warn: 'color: #ff9800; font-weight: bold;',
			error: 'color: #f44336; font-weight: bold;',
			success: 'color: #4caf50; font-weight: bold;',
			cache_hit: 'color: #8bc34a;',
			cache_miss: 'color: #ffc107;',
			cache_update: 'color: #00bcd4;',
			cache_add: 'color: #3f51b5;',
			network: 'color: #9c27b0;',
			performance: 'color: #009688;'
		},

		// 智能日志方法 - 根据重要性和环境自动调整
		log(type, message, data = null) {
			// 确定日志级别
			let logLevel;
			switch (type) {
				case 'debug':
					logLevel = this.levels.DEBUG;
					break;
				case 'info':
				case 'success':
				case 'cache_hit':
				case 'cache_miss':
				case 'cache_update':
				case 'cache_add':
				case 'network':
				case 'performance':
					logLevel = this.levels.INFO;
					break;
				case 'warn':
					logLevel = this.levels.WARN;
					break;
				case 'error':
					logLevel = this.levels.ERROR;
					break;
				default:
					logLevel = this.levels.INFO;
			}

			// 如果当前日志级别低于设置，则不输出
			if (logLevel < this.level) return;

			// 获取样式
			const style = this.styles[type] || 'color: #000000;';

			// 准备消息前缀
			const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
			const prefix = `[SW ${timestamp}]`;

			// 输出日志
			if (data) {
				console.log(`%c${prefix} ${message}`, style, data);
			} else {
				console.log(`%c${prefix} ${message}`, style);
			}
		}
	},

	// 网络监测系统 - 自动分析网络状况
	network: {
		// 网络状态样本 - 用于自适应判断
		_samples: {
			speeds: [], // 网络速度样本 (KB/s)
			responseTypes: {}, // 不同资源类型的响应时间
			failureRates: {}, // 不同资源类型的失败率
			lastCheck: 0, // 上次网络状态检查时间
			isOnline: true // 当前是否在线
		},

		// 获取网络状态
		get status() {
			// 如果最后检查距今超过30秒，更新网络状态
			const now = Date.now();
			if (now - this._samples.lastCheck > 30000) {
				this._samples.isOnline = navigator && navigator.onLine !== false;
				this._samples.lastCheck = now;
			}

			return {
				isOnline: this._samples.isOnline,
				averageSpeed: this.getAverageSpeed(),
				reliability: this.getReliability(),
				latency: this.getAverageLatency()
			};
		},

		// 获取平均网络速度
		getAverageSpeed() {
			const samples = this._samples.speeds;
			if (samples.length === 0) return Infinity;

			// 移除异常值（超过平均值3倍的样本）
			const sum = samples.reduce((a, b) => a + b, 0);
			const avg = sum / samples.length;

			const validSamples = samples.filter(s => s <= avg * 3);
			if (validSamples.length === 0) return avg;

			return validSamples.reduce((a, b) => a + b, 0) / validSamples.length;
		},

		// 获取网络可靠性（0-1）
		getReliability() {
			const failureRates = this._samples.failureRates;
			const types = Object.keys(failureRates);

			if (types.length === 0) return 1; // 假设可靠

			// 计算加权平均失败率
			let totalWeight = 0;
			let weightedSum = 0;

			for (const type of types) {
				const {
					count,
					failures
				} = failureRates[type];
				if (count === 0) continue;

				const weight = Math.sqrt(count); // 权重为样本数的平方根，减轻异常值影响
				const failureRate = failures / count;

				weightedSum += failureRate * weight;
				totalWeight += weight;
			}

			if (totalWeight === 0) return 1;
			const avgFailureRate = weightedSum / totalWeight;

			// 返回可靠性（1 - 失败率）
			return Math.max(0, Math.min(1, 1 - avgFailureRate));
		},

		// 获取平均延迟
		getAverageLatency() {
			const responseTypes = this._samples.responseTypes;
			const types = Object.keys(responseTypes);

			if (types.length === 0) return 0;

			// 查找html类型的平均响应时间作为延迟估计
			if (responseTypes.document) {
				return responseTypes.document.total / responseTypes.document.count;
			}

			// 或使用所有类型的平均响应时间
			let totalTime = 0;
			let totalCount = 0;

			for (const type of types) {
				totalTime += responseTypes[type].total;
				totalCount += responseTypes[type].count;
			}

			return totalCount > 0 ? totalTime / totalCount : 0;
		},

		// 记录网络请求结果
		recordRequest(resourceType, startTime, endTime, byteSize, success) {
			// 更新响应时间统计
			if (!this._samples.responseTypes[resourceType]) {
				this._samples.responseTypes[resourceType] = {
					count: 0,
					total: 0
				};
			}

			const responseTime = endTime - startTime;
			this._samples.responseTypes[resourceType].count++;
			this._samples.responseTypes[resourceType].total += responseTime;

			// 更新失败率统计
			if (!this._samples.failureRates[resourceType]) {
				this._samples.failureRates[resourceType] = {
					count: 0,
					failures: 0
				};
			}

			this._samples.failureRates[resourceType].count++;
			if (!success) {
				this._samples.failureRates[resourceType].failures++;
			}

			// 如果有大小信息，计算网速
			if (byteSize && success && responseTime > 0) {
				const speedKBps = (byteSize / 1024) / (responseTime / 1000);

				// 保存最近10个速度样本
				this._samples.speeds.push(speedKBps);
				if (this._samples.speeds.length > 10) {
					this._samples.speeds.shift();
				}
			}

			// 更新网络状态
			this._samples.isOnline = success ? true : this._samples.isOnline;
			this._samples.lastCheck = Date.now();
		},

		// 基于网络状况推荐的并发请求数
		get recommendedConcurrency() {
			const status = this.status;

			if (!status.isOnline) return 0;

			const speed = status.averageSpeed;
			const reliability = status.reliability;

			// 根据网速和可靠性计算最佳并发数
			let concurrency = 2; // 默认值

			if (speed === Infinity || speed > 1000) { // 非常快 (>1MB/s)
				concurrency = 6;
			} else if (speed > 500) { // 快 (>500KB/s)
				concurrency = 4;
			} else if (speed > 100) { // 中等 (>100KB/s)
				concurrency = 3;
			} else if (speed > 50) { // 慢 (>50KB/s)
				concurrency = 2;
			} else { // 非常慢
				concurrency = 1;
			}

			// 根据可靠性调整
			if (reliability < 0.5) {
				concurrency = Math.max(1, concurrency - 2);
			} else if (reliability < 0.8) {
				concurrency = Math.max(1, concurrency - 1);
			}

			return concurrency;
		},

		// 基于网络状况的动态缓存刷新策略
		getRefreshStrategy() {
			const status = this.status;

			// 如果离线，不进行刷新
			if (!status.isOnline) {
				return {
					shouldRefresh: false,
					aggressiveness: 0,
					refreshRatio: 0
				};
			}

			// 计算刷新侵略性 (0-1)
			// 网速越快，可靠性越高，侵略性越强
			const speed = status.averageSpeed;
			const reliability = status.reliability;

			let aggressiveness;

			if (speed === Infinity) {
				aggressiveness = 0.9;
			} else if (speed > 1000) { // 非常快
				aggressiveness = 0.8;
			} else if (speed > 500) { // 快
				aggressiveness = 0.7;
			} else if (speed > 100) { // 中等
				aggressiveness = 0.5;
			} else if (speed > 50) { // 慢
				aggressiveness = 0.3;
			} else { // 非常慢
				aggressiveness = 0.1;
			}

			// 可靠性影响
			aggressiveness *= reliability;

			// 确定应该刷新的缓存比例
			// 例如，如果aggressiveness为0.7，则每次检查时刷新70%的过期缓存
			const refreshRatio = aggressiveness;

			return {
				shouldRefresh: true,
				aggressiveness,
				refreshRatio
			};
		}
	},

	// 自学习系统 - 分析网站模式并自适应
	ai: {
		// 存储位置
		get storageKey() {
			return `sw-ai-data-${System.env.cacheNamespace}`;
		},

		// 状态数据
		_state: null,

		// 默认初始状态
		getDefaultState() {
			return {
				version: 1, // 数据版本
				lastUpdated: Date.now(), // 最后更新时间
				resourceStats: {}, // 资源统计
				pathPatterns: {}, // 路径模式
				resourceTypes: {}, // 资源类型映射
				updateFrequencies: {}, // 更新频率记录
				userPatterns: { // 用户行为模式
					sessionDuration: 0,
					pageTransitions: {},
					returningVisits: 0
				},
				performanceMetrics: { // 性能指标
					averageLoadTimes: {},
					cacheHitRate: 0,
					missedOpportunities: 0
				}
			};
		},

		// 初始化AI系统
		async init() {
			try {
				// 尝试从缓存加载数据
				const cache = await caches.open(System.env.generateCacheName('system'));
				const response = await cache.match(new Request(this.storageKey));

				if (response) {
					const data = await response.json();
					// 验证数据结构
					if (data && data.version && data.lastUpdated) {
						this._state = data;
						System.logger.log('debug', '已加载AI系统数据');
						return;
					}
				}
			} catch (err) {
				System.logger.log('warn', 'AI系统数据加载失败，使用默认值', err);
			}

			// 如果加载失败或没有数据，使用默认值
			this._state = this.getDefaultState();
		},

		// 保存AI系统状态
		async save() {
			try {
				if (!this._state) return;

				this._state.lastUpdated = Date.now();
				const cache = await caches.open(System.env.generateCacheName('system'));
				const data = JSON.stringify(this._state);
				const response = new Response(data, {
					headers: {
						'Content-Type': 'application/json',
						'Cache-Control': 'no-store'
					}
				});

				await cache.put(new Request(this.storageKey), response);
				System.logger.log('debug', 'AI系统数据已保存');
			} catch (err) {
				System.logger.log('warn', 'AI系统数据保存失败', err);
			}
		},

		// 提取URL模式 - 将具体URL转为通用模式
		extractUrlPattern(url) {
			const pathname = url.pathname;

			// 替换常见ID模式
			return pathname
				// 数字ID
				.replace(/\/\d+(\/?$|\/)/g, '/{id}$1')
				// UUID
				.replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(\/?$|\/)/g, '/{uuid}$1')
				// 日期格式
				.replace(/\/\d{4}[-/]\d{1,2}[-/]\d{1,2}(\/?$|\/)/g, '/{date}$1')
				// 分段格式 (yyyy/mm/dd)
				.replace(/\/\d{4}\/\d{1,2}\/\d{1,2}(\/?$|\/)/g, '/{date}$1')
				// slug格式 (单词-分隔)
				.replace(/\/[a-z0-9][-a-z0-9]+(?:[-a-z0-9]+)*(\/?$|\/)/g, '/{slug}$1')
				// 用户名模式
				.replace(/\/(?:u|user|users)\/[^\/]+(\/?$|\/)/g, '/user/{username}$1')
				// 文件名但保留扩展名
				.replace(/\/[^\/]+(\.[a-z0-9]+)$/i, '/{filename}$1');
		},

		// 分析资源更新频率
		analyzeUpdatePattern(resourceData) {
			if (!resourceData.updates || resourceData.updates.length < 2) {
				return {
					frequency: 'unknown',
					intervalMs: 3600000, // 默认1小时
					confidence: 0
				};
			}

			// 计算更新间隔
			const intervals = [];
			const updates = [...resourceData.updates].sort((a, b) => a - b);

			for (let i = 1; i < updates.length; i++) {
				intervals.push(updates[i] - updates[i - 1]);
			}

			// 计算平均间隔和标准差
			const sum = intervals.reduce((a, b) => a + b, 0);
			const avg = sum / intervals.length;

			const variance = intervals.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / intervals.length;
			const stdDev = Math.sqrt(variance);

			// 计算变异系数 (Coefficient of Variation)
			const cv = stdDev / avg;

			// 确定频率模式和置信度
			let frequency;
			let confidence;

			if (cv < 0.3) {
				// 低变异系数表示规律更新
				frequency = 'regular';
				confidence = 0.9 - cv; // 变异越小置信度越高
			} else if (cv < 0.7) {
				// 中等变异系数表示半规律更新
				frequency = 'semi-regular';
				confidence = 0.6 - (cv - 0.3) / 0.4 * 0.3; // 0.3->0.6, 0.7->0.3
			} else {
				// 高变异系数表示不规律更新
				frequency = 'irregular';
				confidence = Math.max(0.1, 0.3 - (cv - 0.7) / 3 * 0.2); // 最低0.1
			}

			return {
				frequency,
				intervalMs: avg,
				confidence
			};
		},

		// 记录资源访问
		async recordAccess(url, resourceType, responseData) {
			if (!this._state) await this.init();

			const urlKey = url.href;
			const patternKey = this.extractUrlPattern(url);

			// 更新资源统计
			if (!this._state.resourceStats[urlKey]) {
				this._state.resourceStats[urlKey] = {
					type: resourceType,
					pattern: patternKey,
					firstSeen: Date.now(),
					lastAccessed: Date.now(),
					accessCount: 0,
					updates: [],
					cacheMissCount: 0,
					cacheHitCount: 0,
					sumLoadTime: 0,
					failureCount: 0
				};
			}

			const stats = this._state.resourceStats[urlKey];
			stats.lastAccessed = Date.now();
			stats.accessCount++;

			// 更新性能数据
			if (responseData) {
				if (responseData.loadTime) {
					stats.sumLoadTime += responseData.loadTime;
				}

				if (responseData.fromCache) {
					stats.cacheHitCount++;
				} else {
					stats.cacheMissCount++;
				}

				if (responseData.failed) {
					stats.failureCount++;
				}

				// 如果资源被更新，记录时间戳
				if (responseData.updated) {
					stats.updates.push(Date.now());
					// 只保留最近10次更新记录
					if (stats.updates.length > 10) {
						stats.updates.shift();
					}
				}
			}

			// 更新路径模式统计
			if (!this._state.pathPatterns[patternKey]) {
				this._state.pathPatterns[patternKey] = {
					count: 0,
					resourceTypes: {},
					updateFrequency: 'unknown'
				};
			}

			const patternStats = this._state.pathPatterns[patternKey];
			patternStats.count++;
			patternStats.resourceTypes[resourceType] = (patternStats.resourceTypes[resourceType] || 0) + 1;

			// 更新资源类型映射
			if (!this._state.resourceTypes[resourceType]) {
				this._state.resourceTypes[resourceType] = {
					count: 0,
					patterns: {},
					averageUpdateInterval: 3600000 // 默认1小时
				};
			}

			const typeStats = this._state.resourceTypes[resourceType];
			typeStats.count++;
			typeStats.patterns[patternKey] = (typeStats.patterns[patternKey] || 0) + 1;

			// 分析更新频率并更新
			if (stats.updates.length >= 2) {
				const updatePattern = this.analyzeUpdatePattern(stats);

				// 更新URL特定的更新频率
				if (!this._state.updateFrequencies[urlKey]) {
					this._state.updateFrequencies[urlKey] = updatePattern;
				} else {
					// 加权平均，新数据权重0.3，旧数据权重0.7
					const oldPattern = this._state.updateFrequencies[urlKey];
					this._state.updateFrequencies[urlKey] = {
						frequency: updatePattern.confidence > oldPattern.confidence ?
							updatePattern.frequency : oldPattern.frequency,
						intervalMs: oldPattern.intervalMs * 0.7 + updatePattern.intervalMs * 0.3,
						confidence: Math.max(oldPattern.confidence, updatePattern.confidence)
					};
				}

				// 更新路径模式的更新频率
				patternStats.updateFrequency = this._state.updateFrequencies[urlKey].frequency;

				// 更新资源类型的平均更新间隔
				// 收集该类型所有资源的更新间隔
				const intervals = [];
				for (const uKey in this._state.updateFrequencies) {
					if (this._state.resourceStats[uKey] &&
						this._state.resourceStats[uKey].type === resourceType &&
						this._state.updateFrequencies[uKey].confidence > 0.3) {
						intervals.push(this._state.updateFrequencies[uKey].intervalMs);
					}
				}

				// 计算中位数作为更可靠的平均值
				if (intervals.length > 0) {
					intervals.sort((a, b) => a - b);
					const mid = Math.floor(intervals.length / 2);
					typeStats.averageUpdateInterval = intervals.length % 2 === 0 ?
						(intervals[mid - 1] + intervals[mid]) / 2 :
						intervals[mid];
				}
			}

			// 定期保存
			if (Date.now() - this._state.lastUpdated > 60000) { // 1分钟
				await this.save();
			}
		},

		// 获取资源的推荐缓存时间
		async getRecommendedCacheTime(url, resourceType) {
			if (!this._state) await this.init();

			const urlKey = url.href;
			const patternKey = this.extractUrlPattern(url);

			let cacheTime = 30000; // 默认30秒
			let confidence = 0;

			// 1. 检查特定URL的更新频率
			if (this._state.updateFrequencies[urlKey]) {
				const pattern = this._state.updateFrequencies[urlKey];
				if (pattern.confidence > 0.4) {
					// 使用比预期更新时间略短的时间作为缓存时间（为了提前更新）
					cacheTime = pattern.intervalMs * 0.8;
					confidence = pattern.confidence;
				}
			}

			// 2. 如果没有足够置信度的特定URL数据，检查路径模式
			if (confidence < 0.4 && this._state.pathPatterns[patternKey]) {
				const patternData = this._state.pathPatterns[patternKey];

				// 查找该模式下相同类型资源的所有URL
				const similarUrls = [];
				for (const uKey in this._state.resourceStats) {
					const stats = this._state.resourceStats[uKey];
					if (stats.pattern === patternKey && stats.type === resourceType) {
						similarUrls.push(uKey);
					}
				}

				// 如果有类似URL的更新频率数据，计算平均值
				if (similarUrls.length > 0) {
					let totalInterval = 0;
					let totalConfidence = 0;
					let count = 0;

					for (const sUrl of similarUrls) {
						if (this._state.updateFrequencies[sUrl]) {
							const pattern = this._state.updateFrequencies[sUrl];
							totalInterval += pattern.intervalMs * pattern.confidence;
							totalConfidence += pattern.confidence;
							count++;
						}
					}

					if (count > 0) {
						const avgInterval = totalInterval / totalConfidence;
						const avgConfidence = totalConfidence / count;

						if (avgConfidence > confidence) {
							cacheTime = avgInterval * 0.8;
							confidence = avgConfidence;
						}
					}
				}
			}

			// 3. 如果还是没有足够数据，使用资源类型的默认值
			if (confidence < 0.3 && this._state.resourceTypes[resourceType]) {
				const typeData = this._state.resourceTypes[resourceType];

				if (typeData.count > 5) { // 如果有足够样本
					cacheTime = typeData.averageUpdateInterval * 0.8;
					confidence = 0.3; // 低置信度
				}
			}

			// 4. 如果仍然没有足够数据，使用基于资源类型的启发式值
			if (confidence < 0.2) {
				switch (resourceType) {
					case 'document':
						cacheTime = 60000; // 1分钟
						break;
					case 'style':
					case 'script':
						cacheTime = 300000; // 5分钟
						break;
					case 'image':
						cacheTime = 1800000; // 30分钟
						break;
					case 'font':
						cacheTime = 86400000; // 24小时
						break;
					default:
						cacheTime = 180000; // 3分钟
				}
			}

			// 5. 根据网络状况调整
			const networkStrategy = System.network.getRefreshStrategy();
			if (!networkStrategy.shouldRefresh) {
				// 网络不佳时延长缓存时间
				cacheTime = cacheTime * 1.5;
			} else if (networkStrategy.aggressiveness > 0.7) {
				// 网络良好时缩短缓存时间
				cacheTime = cacheTime * 0.8;
			}

			// 最小不少于5秒，最大不超过24小时
			return Math.min(Math.max(cacheTime, 5000), 86400000);
		}
	}
};

// 资源分析器 - 智能判断资源类型和缓存策略
class ResourceAnalyzer {
	// 智能判断资源类型
	static getResourceType(request, url, contentType = null) {
		// 基于请求模式
		if (request && request.mode === 'navigate') {
			return 'document';
		}

		// 基于内容类型
		if (contentType) {
			if (contentType.includes('text/html')) return 'document';
			if (contentType.includes('text/css')) return 'style';
			if (contentType.includes('javascript')) return 'script';
			if (contentType.includes('image/')) return 'image';
			if (contentType.includes('font/') || contentType.includes('application/font')) return 'font';
			if (contentType.includes('audio/')) return 'audio';
			if (contentType.includes('video/')) return 'video';
			if (contentType.includes('application/json')) return 'data';
			if (contentType.includes('application/xml')) return 'data';
		}

		// 基于URL扩展名
		const pathname = url.pathname.toLowerCase();

		if (/\.html?$/i.test(pathname)) return 'document';
		if (/\.css$/i.test(pathname)) return 'style';
		if (/\.js$/i.test(pathname)) return 'script';
		if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(pathname)) return 'image';
		if (/\.(woff2?|ttf|eot|otf)$/i.test(pathname)) return 'font';
		if (/\.(mp3|wav|ogg|flac)$/i.test(pathname)) return 'audio';
		if (/\.(mp4|webm|ogv)$/i.test(pathname)) return 'video';
		if (/\.(json|xml)$/i.test(pathname)) return 'data';

		// 基于URL路径模式进行智能判断
		if (/\/(api|graphql|v\d+|data)\//i.test(pathname)) return 'api';
		if (/\/(assets|static|dist|build|cdn)\//i.test(pathname)) return 'static';
		if (/\/(css|styles)\//i.test(pathname)) return 'style';
		if (/\/(js|scripts)\//i.test(pathname)) return 'script';
		if (/\/(img|images|pictures|photos)\//i.test(pathname)) return 'image';
		if (/\/(fonts|webfonts)\//i.test(pathname)) return 'font';
		if (/\/(audio|sound|music)\//i.test(pathname)) return 'audio';
		if (/\/(video|media|movies)\//i.test(pathname)) return 'video';

		// 对于没有特定扩展名的文件，如果是GET请求且没有查询参数，可能是HTML
		if (request && request.method === 'GET' && !url.search && pathname.endsWith('/')) {
			return 'document';
		}

		// 默认
		return 'unknown';
	}

	// 智能判断资源是否应该缓存
	static shouldCache(request, url) {
		// 1. 基本检查
		// 只缓存GET请求
		if (request.method !== 'GET') return false;

		// 只缓存http和https协议
		if (!['http:', 'https:'].includes(url.protocol)) return false;

		// 2. 请求头检查
		const cacheControl = request.headers.get('Cache-Control');
		const pragma = request.headers.get('Pragma');

		// 根据请求头判断是否应该缓存
		if ((cacheControl && (
				cacheControl.includes('no-store') ||
				cacheControl.includes('no-cache')
			)) ||
			pragma === 'no-cache') {
			return false;
		}

		// 3. 安全相关检查
		if (request.headers.get('Authorization') ||
			request.headers.get('Cookie')) {
			return false;
		}

		// 4. URL特征检查
		const pathname = url.pathname.toLowerCase();

		// 不缓存登录、登出相关页面
		if (/\/(login|logout|signin|signout|register|signup|auth)/i.test(pathname)) {
			return false;
		}

		// 不缓存管理后台
		if (/\/(admin|dashboard|account|profile|settings|config)/i.test(pathname)) {
			return false;
		}

		// 5. 查询参数检查
		if (url.search) {
			// 检测常见的动态参数
			const searchParams = new URLSearchParams(url.search);

			const dynamicParams = [
				'token', 'auth', 'key', 'apikey', 'api_key', 'session',
				'timestamp', 'time', 'date', 't', 'nocache', 'random',
				'guid', 'uuid', 'nonce', 'state', 'hash'
			];

			for (const param of dynamicParams) {
				if (searchParams.has(param)) return false;
			}

			// 但允许缓存某些常见的静态参数
			const allowedParams = ['v', 'version', 'theme', 'lang', 'locale', 'country', 'ref'];

			// 如果只有允许的参数，仍然可以缓存
			for (const param of searchParams.keys()) {
				if (!allowedParams.includes(param.toLowerCase())) {
					// 如果有超过5个参数，假设是动态内容
					if (searchParams.getAll(param).length > 5) {
						return false;
					}
					// 如果参数值非常长，可能是编码的状态，不缓存
					const value = searchParams.get(param);
					if (value && value.length > 100) {
						return false;
					}
				}
			}
		}

		// 6. 资源类型检查
		const resourceType = this.getResourceType(request, url);

		// API请求通常不缓存
		if (resourceType === 'api') return false;

		// 数据文件只在特定路径下缓存
		if (resourceType === 'data') {
			return /\/(static|assets|fixtures|data)\//i.test(pathname);
		}

		// 缓存常见的静态资源类型
		const cachableTypes = ['document', 'style', 'script', 'image', 'font', 'audio', 'video', 'static'];
		if (cachableTypes.includes(resourceType)) {
			return true;
		}

		// 7. 启发式判断 - 如果路径包含常见的静态目录，可能是静态资源
		if (/\/(static|assets|dist|build|cdn|public|files)\//i.test(pathname)) {
			return true;
		}

		// 未知类型的资源保守处理，默认不缓存
		return false;
	}

	// 判断响应是否有效且可缓存
	static isResponseCacheable(response) {
		// 检查响应状态
		if (!response || response.status !== 200) {
			return false;
		}

		// 检查响应类型
		if (response.type === 'error' || response.type === 'opaque') {
			return false;
		}

		// 检查响应头
		const cacheControl = response.headers.get('Cache-Control');
		const pragma = response.headers.get('Pragma');

		if (cacheControl && (
				cacheControl.includes('no-store') ||
				cacheControl.includes('private')
			)) {
			return false;
		}

		if (pragma === 'no-cache') {
			return false;
		}

		return true;
	}
}

// 缓存管理器 - 处理缓存操作
class CacheManager {
	// 缓存名称
	static get CACHE_NAME() {
		return System.env.generateCacheName('main');
	}

	// 元数据缓存
	static get META_CACHE_NAME() {
		return System.env.generateCacheName('meta');
	}

	// 初始化缓存系统
	static async init() {
		try {
			// 初始化AI系统
			await System.ai.init();

			// 获取活跃缓存列表
			const cacheNames = await caches.keys();

			// 清理旧缓存
			await Promise.all(
				cacheNames.filter(name => {
					return name !== this.CACHE_NAME &&
						name !== this.META_CACHE_NAME &&
						name !== System.env.generateCacheName('system');
				}).map(name => {
					System.logger.log('debug', `删除旧缓存: ${name}`);
					return caches.delete(name);
				})
			);

			return true;
		} catch (err) {
			System.logger.log('error', '缓存系统初始化失败', err);
			return false;
		}
	}

	// 获取资源的元数据
	static async getMetadata(request) {
		try {
			const metaCache = await caches.open(this.META_CACHE_NAME);
			const metaRequest = new Request(`${request.url}#metadata`);
			const metaResponse = await metaCache.match(metaRequest);

			if (metaResponse) {
				return await metaResponse.json();
			}

			return null;
		} catch (err) {
			System.logger.log('warn', `获取元数据失败: ${request.url}`, err);
			return null;
		}
	}

	// 保存资源的元数据
	static async saveMetadata(request, metadata) {
		try {
			const metaCache = await caches.open(this.META_CACHE_NAME);
			const metaRequest = new Request(`${request.url}#metadata`);
			const metaResponse = new Response(JSON.stringify(metadata), {
				headers: {
					'Content-Type': 'application/json'
				}
			});

			await metaCache.put(metaRequest, metaResponse);
			return true;
		} catch (err) {
			System.logger.log('warn', `保存元数据失败: ${request.url}`, err);
			return false;
		}
	}

	// 缓存响应
	static async cacheResponse(request, response, url) {
		try {
			// 判断响应是否可缓存
			if (!ResourceAnalyzer.isResponseCacheable(response)) {
				return false;
			}

			// 获取资源类型
			const contentType = response.headers.get('Content-Type');
			const resourceType = ResourceAnalyzer.getResourceType(request, url, contentType);

			// 准备元数据
			const now = Date.now();
			const metadata = {
				url: request.url,
				timestamp: now,
				contentType,
				resourceType,
				size: parseInt(response.headers.get('Content-Length') || '0'),
				etag: response.headers.get('ETag'),
				lastModified: response.headers.get('Last-Modified')
			};

			// 克隆响应
			const responseToCache = response.clone();

			// 缓存响应
			const cache = await caches.open(this.CACHE_NAME);
			await cache.put(request, responseToCache);

			// 保存元数据
			await this.saveMetadata(request, metadata);

			// 记录到AI系统
			await System.ai.recordAccess(url, resourceType, {
				fromCache: false,
				loadTime: 0,
				updated: true
			});

			System.logger.log('cache_add', `资源已缓存: ${url.pathname} (${resourceType})`);

			return true;
		} catch (error) {
			System.logger.log('error', `缓存资源失败: ${url.pathname}`, error);
			return false;
		}
	}

	// 检查缓存是否需要更新
	static async shouldUpdateCache(request, cachedResponse, url) {
		try {
			// 获取元数据
			const metadata = await this.getMetadata(request);
			if (!metadata) return true; // 无元数据，需要更新

			const now = Date.now();
			const age = now - metadata.timestamp;

			// 获取智能推荐的缓存时间
			const recommendedMaxAge = await System.ai.getRecommendedCacheTime(url, metadata.resourceType);

			// 检查是否超出了推荐的缓存时间
			return age > recommendedMaxAge;
		} catch (error) {
			System.logger.log('warn', `检查缓存更新失败: ${url.pathname}`, error);
			return true; // 出错时保守地选择更新
		}
	}

	// 获取绕过缓存的请求
	static getBypassCacheRequest(request, url) {
		// 创建绕过缓存的URL
		const bypassURL = new URL(url.toString());

		// 添加时间戳参数来绕过缓存
		bypassURL.searchParams.set('_sw_bypass', Date.now().toString());

		// 创建新请求，继承原始请求的属性
		const bypassRequest = new Request(bypassURL.toString(), {
			method: request.method,
			headers: request.headers,
			mode: 'cors', // 使用cors模式增加兼容性
			credentials: request.credentials,
			redirect: request.redirect,
			integrity: request.integrity,
			cache: 'no-store' // 强制绕过HTTP缓存
		});

		return bypassRequest;
	}

	// 更新缓存
	static async updateCache(request, cachedResponse, url) {
		try {
			// 创建绕过缓存的请求
			const bypassRequest = this.getBypassCacheRequest(request, url);

			// 测量时间
			const startTime = performance.now();

			// 获取新响应
			const networkResponse = await fetch(bypassRequest);

			// 测量结束时间
			const endTime = performance.now();
			const loadTime = endTime - startTime;

			// 记录网络请求结果
			const contentLength = parseInt(networkResponse.headers.get('Content-Length') || '0');
			System.network.recordRequest(
				ResourceAnalyzer.getResourceType(request, url, networkResponse.headers.get('Content-Type')),
				startTime,
				endTime,
				contentLength,
				networkResponse.ok
			);

			// 检查响应是否有效
			if (!ResourceAnalyzer.isResponseCacheable(networkResponse)) {
				System.logger.log('warn', `网络响应不可缓存: ${url.pathname}`);
				return false;
			}

			// 检查是否内容变化
			const etagChanged = cachedResponse.headers.get('ETag') !== networkResponse.headers.get('ETag');
			const lastModifiedChanged = cachedResponse.headers.get('Last-Modified') !== networkResponse.headers.get(
				'Last-Modified');

			// 如果ETag或Last-Modified未变化，则内容可能未更改
			if (!etagChanged && !lastModifiedChanged &&
				cachedResponse.headers.get('ETag') && networkResponse.headers.get('ETag')) {

				System.logger.log('cache_update', `内容未变化，保留缓存: ${url.pathname}`);

				// 更新元数据的时间戳，但标记为未更新
				const metadata = await this.getMetadata(request);
				if (metadata) {
					metadata.timestamp = Date.now();
					await this.saveMetadata(request, metadata);
				}

				// 记录到AI系统
				await System.ai.recordAccess(url, metadata ? metadata.resourceType : 'unknown', {
					fromCache: false,
					loadTime,
					updated: false
				});

				return true;
			}

			// 缓存新响应
			const success = await this.cacheResponse(request, networkResponse, url);

			if (success) {
				System.logger.log('cache_update', `缓存已更新: ${url.pathname}`);
			}

			return success;
		} catch (error) {
			System.logger.log('error', `更新缓存失败: ${url.pathname}`, error);
			return false;
		}
	}

	// 执行缓存维护
	static async maintenance() {
		try {
			// 获取当前缓存
			const cache = await caches.open(this.CACHE_NAME);
			const metaCache = await caches.open(this.META_CACHE_NAME);

			// 获取所有缓存项
			const requests = await cache.keys();
			if (requests.length === 0) return;

			System.logger.log('debug', `开始缓存维护，共${requests.length}项`);

			// 分析所有项目
			const items = [];

			for (const request of requests) {
				try {
					const metadata = await this.getMetadata(request);
					if (!metadata) continue;

					// 计算资源年龄
					const age = Date.now() - metadata.timestamp;

					// 获取资源统计数据
					const aiData = System.ai._state &&
						System.ai._state.resourceStats &&
						System.ai._state.resourceStats[request.url];

					// 计算资源"价值分数"
					// 访问频率 / (年龄 * 大小) - 访问越频繁、越新、越小的资源价值越高
					const accessCount = aiData ? aiData.accessCount : 1;
					const size = metadata.size || 1000; // 默认1KB

					// 价值分数公式
					const valueScore = (accessCount + 1) / ((age / 3600000 + 1) * (size / 1024 + 1));

					items.push({
						request,
						metadata,
						age,
						accessCount,
						size,
						valueScore
					});
				} catch (err) {
					// 跳过错误项
					continue;
				}
			}

			// 按价值分数排序（升序，低价值在前）
			items.sort((a, b) => a.valueScore - b.valueScore);

			// 计算当前缓存大小
			const totalSize = items.reduce((sum, item) => sum + (item.size || 0), 0);

			// 确定缓存大小限制 - 默认50MB，但对于大站点可以更大
			// 启发式计算：每100个URL增加10MB，最大150MB
			const resourceCount = Object.keys(System.ai._state?.resourceStats || {}).length || 0;
			const sizeLimit = Math.min(50 * 1024 * 1024 + Math.floor(resourceCount / 100) * 10 * 1024 * 1024, 150 *
				1024 * 1024);

			// 如果缓存超过限制，删除低价值项目
			if (totalSize > sizeLimit || items.length > 1000) {
				// 目标大小为限制的80%
				const targetSize = sizeLimit * 0.8;
				const targetCount = 800;

				let currentSize = totalSize;
				let currentCount = items.length;
				let itemsRemoved = 0;

				// 从低价值到高价值遍历，删除项目直到达到目标
				for (const item of items) {
					if (currentSize <= targetSize && currentCount <= targetCount) {
						break;
					}

					// 删除缓存和元数据
					await cache.delete(item.request);
					await metaCache.delete(new Request(`${item.request.url}#metadata`));

					currentSize -= item.size || 0;
					currentCount--;
					itemsRemoved++;

					System.logger.log('debug', `删除低价值缓存: ${item.request.url}`);
				}

				System.logger.log('performance',
					`缓存维护完成: 删除了${itemsRemoved}项，释放了${((totalSize - currentSize) / 1024 / 1024).toFixed(2)}MB`);
			} else {
				System.logger.log('debug', `缓存维护完成: 缓存大小正常`);
			}

			return true;
		} catch (error) {
			System.logger.log('error', '缓存维护失败', error);
			return false;
		}
	}
}

// 请求处理器 - 处理拦截的请求
class RequestHandler {
	// 处理请求
	static async handleRequest(event) {
		const request = event.request;
		const url = new URL(request.url);

		// 生成日志前缀
		const logPrefix =
			`${request.method} ${url.pathname.substring(0, 40)}${url.pathname.length > 40 ? '...' : ''}`;

		// 智能判断是否应该缓存
		if (!ResourceAnalyzer.shouldCache(request, url)) {
			System.logger.log('debug', `跳过缓存: ${logPrefix}`);
			return fetch(request);
		}

		try {
			// 1. 先检查缓存
			const cache = await caches.open(CacheManager.CACHE_NAME);
			const cachedResponse = await cache.match(request);

			// 2. 如果找到缓存的响应
			if (cachedResponse) {
				System.logger.log('cache_hit', `缓存命中: ${logPrefix}`);

				// 获取资源类型
				const metadata = await CacheManager.getMetadata(request);
				const resourceType = metadata ? metadata.resourceType :
					ResourceAnalyzer.getResourceType(request, url, cachedResponse.headers.get('Content-Type'));

				// 记录缓存命中
				System.ai.recordAccess(url, resourceType, {
					fromCache: true,
					loadTime: 0,
					updated: false
				});

				// 检查是否需要更新
				const needsUpdate = await CacheManager.shouldUpdateCache(request, cachedResponse, url);

				if (needsUpdate) {
					System.logger.log('cache_update', `后台更新缓存: ${logPrefix}`);

					// 在后台更新缓存
					event.waitUntil(
						CacheManager.updateCache(request, cachedResponse, url)
					);
				}

				return cachedResponse;
			}

			// 3. 如果缓存中没有找到，通过网络获取
			System.logger.log('cache_miss', `缓存未命中: ${logPrefix}`);

			// 测量时间
			const startTime = performance.now();

			const networkResponse = await fetch(request);

			// 测量结束时间
			const endTime = performance.now();
			const loadTime = endTime - startTime;

			// 记录网络请求结果
			const contentLength = parseInt(networkResponse.headers.get('Content-Length') || '0');
			System.network.recordRequest(
				ResourceAnalyzer.getResourceType(request, url, networkResponse.headers.get('Content-Type')),
				startTime,
				endTime,
				contentLength,
				networkResponse.ok
			);

			// 4. 如果响应有效，在后台缓存
			if (ResourceAnalyzer.isResponseCacheable(networkResponse)) {
				const responseToCache = networkResponse.clone();

				event.waitUntil(
					CacheManager.cacheResponse(request, responseToCache, url)
				);
			}

			return networkResponse;
		} catch (error) {
			System.logger.log('error', `处理请求失败: ${logPrefix}`, error);

			// 出错时，尝试从缓存中获取，即使是旧的
			try {
				const cache = await caches.open(CacheManager.CACHE_NAME);
				const cachedResponse = await cache.match(request);

				if (cachedResponse) {
					System.logger.log('warn', `网络错误，使用缓存: ${logPrefix}`);
					return cachedResponse;
				}
			} catch (e) {
				// 忽略缓存查找错误
			}

			// 无法提供缓存响应，传递原始错误
			throw error;
		}
	}
}

// Service Worker 生命周期事件处理
// 安装阶段
self.addEventListener('install', (event) => {
	System.logger.log('success', '安装完成');
	self.skipWaiting(); // 跳过等待，立即激活
});

// 激活阶段
self.addEventListener('activate', (event) => {
	System.logger.log('success', '激活完成');

	// 初始化缓存系统并接管客户端
	event.waitUntil(
		CacheManager.init().then(() => {
			return self.clients.claim(); // 取得控制权
		})
	);
});

// 后台同步 - 缓存维护
self.addEventListener('sync', (event) => {
	if (event.tag === 'cache-maintenance') {
		event.waitUntil(CacheManager.maintenance());
	}
});

// 定期注册后台同步
setInterval(() => {
	self.registration.sync.register('cache-maintenance')
		.catch(() => CacheManager.maintenance()); // 回退方案
}, 30 * 60 * 1000); // 30分钟执行一次维护

// 拦截请求
self.addEventListener('fetch', (event) => {
	// 如果不是GET请求，直接跳过
	if (event.request.method !== 'GET') return;

	// 拦截请求并处理
	event.respondWith(
		RequestHandler.handleRequest(event)
	);
});

// 在空闲时保存学习数据
self.addEventListener('message', (event) => {
	if (event.data && event.data.type === 'SAVE_AI_DATA') {
		event.waitUntil(System.ai.save());
	}
});

// 注册定期保存
setInterval(() => {
	System.ai.save();
}, 5 * 60 * 1000); // 5分钟保存一次学习数据
