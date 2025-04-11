// (function() {
// 	let isInitialized = false;

// 	// 简单日志
// 	function log(msg) {
// 		console.log('[PullToRefresh]', msg);
// 	}

// 	// 注入样式并初始化
// 	function loadAndInit() {
// 		if (isInitialized) return;

// 		// 注入样式
// 		if (!document.querySelector('#ptr-style')) {
// 			const style = document.createElement('style');
// 			style.id = 'ptr-style';
// 			style.textContent = '.ptr--text, .ptr--icon { color: #9b685b !important; }';
// 			document.documentElement.appendChild(style);
// 			log('样式已注入');
// 		}

// 		// 如果库已加载，直接初始化
// 		if (window.PullToRefresh) {
// 			try {
// 				PullToRefresh.init({
// 					mainElement: 'body',
// 					onRefresh() {
// 						log('触发刷新');
// 						window.location.reload();
// 					}
// 				});
// 				isInitialized = true;
// 				log('初始化成功');
// 				return;
// 			} catch (e) {
// 				log('初始化失败，重试中');
// 			}
// 		}

// 		// 加载库
// 		const script = document.createElement('script');
// 		script.src = 'https://cdn.jsdelivr.net/npm/pulltorefreshjs/dist/index.umd.min.js';

// 		script.onload = () => {
// 			log('库加载完成');
// 			setTimeout(loadAndInit, 100);
// 		};

// 		script.onerror = () => {
// 			log('库加载失败，重试中');
// 			setTimeout(loadAndInit, 100);
// 		};

// 		document.documentElement.appendChild(script);
// 	}

// 	// 如果body存在直接初始化，否则等待body
// 	if (document.body) {
// 		loadAndInit();
// 	} else {
// 		new MutationObserver((mutations, obs) => {
// 			if (document.body) {
// 				loadAndInit();
// 				obs.disconnect();
// 			}
// 		}).observe(document.documentElement, {
// 			childList: true,
// 			subtree: true
// 		});
// 	}
// })();
(function() {
	// 避免重复初始化
	if (window.__PTR_INITIALIZED__) return;

	// 提前设置标志，防止重复执行
	window.__PTR_INITIALIZED__ = true;

	// 内联样式直接注入，避免DOM操作延迟
	const style = document.createElement('style');
	style.textContent = '.ptr--text, .ptr--icon { color: #9b685b !important; }';
	document.head.appendChild(style);

	// 使用更高效的日志方式
	const log = (msg) => console.log('[PTR]', msg);
	log('开始初始化');

	// 创建初始化函数
	function initPTR() {
		if (!window.PullToRefresh) {
			log('等待库加载...');
			return false;
		}
		try {
			window.PullToRefresh.init({
				mainElement: 'body',
				onRefresh() {
					log('触发刷新');
					window.location.reload();
				}
			});
			log('初始化成功');
			return true;
		} catch (e) {
			log('初始化错误: ' + e.message);
			return false;
		}
	}

	// 使用预加载和资源提示来加速脚本加载
	const link = document.createElement('link');
	link.rel = 'preload';
	link.as = 'script';
	link.href = 'https://cdn.jsdelivr.net/npm/pulltorefreshjs/dist/index.umd.min.js';
	document.head.appendChild(link);

	// 立即加载脚本，不等待DOM完全加载
	const script = document.createElement('script');
	script.src = link.href;
	script.async = false; // 同步加载提高优先级

	// 在多个阶段尝试初始化，确保尽快完成
	script.onload = function() {
		log('库加载完成');
		// 立即尝试初始化
		if (!initPTR()) {
			// 如果失败，在下一个微任务中再次尝试
			Promise.resolve().then(initPTR);
			// 同时在下一帧也尝试初始化
			requestAnimationFrame(initPTR);
		}
	};

	// 挂载脚本（优先放在head中加快解析）
	(document.head || document.documentElement).appendChild(script);

	// 如果DOM已经可用，立即尝试初始化
	if (document.readyState !== 'loading') {
		initPTR();
	} else {
		// 在DOMContentLoaded时尝试初始化
		document.addEventListener('DOMContentLoaded', initPTR, {
			once: true
		});
	}

	// 如果一段时间后仍未初始化，强制重试
	setTimeout(function() {
		if (!window.PullToRefresh) {
			log('加载超时，尝试重新加载');
			const fallbackScript = document.createElement('script');
			fallbackScript.src =
				'https://cdnjs.cloudflare.com/ajax/libs/pulltorefreshjs/0.1.22/index.umd.min.js';
			fallbackScript.onload = initPTR;
			document.head.appendChild(fallbackScript);
		}
	}, 3000);
})();
