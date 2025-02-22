(function() {
	let isInitialized = false;

	// 简单日志
	function log(msg) {
		console.log('[PullToRefresh]', msg);
	}

	// 注入样式并初始化
	function loadAndInit() {
		if (isInitialized) return;

		// 注入样式
		if (!document.querySelector('#ptr-style')) {
			const style = document.createElement('style');
			style.id = 'ptr-style';
			style.textContent = '.ptr--text, .ptr--icon { color: #9b685b !important; }';
			document.documentElement.appendChild(style);
			log('样式已注入');
		}

		// 如果库已加载，直接初始化
		if (window.PullToRefresh) {
			try {
				PullToRefresh.init({
					mainElement: 'body',
					onRefresh() {
						log('触发刷新');
						window.location.reload();
					}
				});
				isInitialized = true;
				log('初始化成功');
				return;
			} catch (e) {
				log('初始化失败，重试中');
			}
		}

		// 加载库
		const script = document.createElement('script');
		script.src = 'https://cdn.jsdelivr.net/npm/pulltorefreshjs/dist/index.umd.min.js';

		script.onload = () => {
			log('库加载完成');
			setTimeout(loadAndInit, 100);
		};

		script.onerror = () => {
			log('库加载失败，重试中');
			setTimeout(loadAndInit, 100);
		};

		document.documentElement.appendChild(script);
	}

	// 如果body存在直接初始化，否则等待body
	if (document.body) {
		loadAndInit();
	} else {
		new MutationObserver((mutations, obs) => {
			if (document.body) {
				loadAndInit();
				obs.disconnect();
			}
		}).observe(document.documentElement, {
			childList: true,
			subtree: true
		});
	}
})();
