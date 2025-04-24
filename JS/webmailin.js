(function() {
	let isInitialized = false;

	// 简单日志函数
	function log(msg) {
		console.log('[PullToRefresh]', msg);
	}

	// 注入样式
	function injectStyle() {
		if (!document.querySelector('#ptr-style')) {
			const style = document.createElement('style');
			style.id = 'ptr-style';
			style.textContent = '.ptr--text, .ptr--icon { color: #9b685b !important; }';
			document.documentElement.appendChild(style);
			log('样式已注入');
		}
	}

	// 初始化下拉刷新
	function initPullToRefresh() {
		// 避免重复初始化
		if (isInitialized) return;

		injectStyle();

		// 确保 PullToRefresh 库已加载
		if (window.PullToRefresh) {
			try {
				PullToRefresh.init({
					// 外层监听区域
					mainElement: '#messagelist-header',
					// 判断是否允许下拉刷新的逻辑：只有当内部滚动容器处于最顶部时才允许
					shouldPullToRefresh() {
						const content = document.querySelector('#messagelist-content');
						// 如果内部容器存在且滚动到顶部则返回 true，否则返回 false
						return content && content.scrollTop === 0;
					},
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

		// 如果库未加载，则动态加载库
		const script = document.createElement('script');
		script.src = 'https://cdn.jsdelivr.net/npm/pulltorefreshjs/dist/index.umd.min.js';
		script.onload = () => {
			log('库加载完成');
			setTimeout(initPullToRefresh, 100);
		};
		script.onerror = () => {
			log('库加载失败，重试中');
			setTimeout(initPullToRefresh, 100);
		};
		document.documentElement.appendChild(script);
	}

	// 检查外层元素是否存在，如果不存在则等待出现
	function waitForOuterElement() {
		const header = document.querySelector('#messagelist-header');
		if (header) {
			initPullToRefresh();
		} else {
			// MutationObserver 监听 DOM 变化
			const observer = new MutationObserver((mutations, obs) => {
				if (document.querySelector('#messagelist-header')) {
					initPullToRefresh();
					obs.disconnect();
				}
			});
			observer.observe(document.documentElement, {
				childList: true,
				subtree: true
			});
		}
	}

	// 开始执行
	waitForOuterElement();
})();

document.addEventListener("DOMContentLoaded", function() {
	// 检测是否为 PWA 模式（包括 standalone 模式或 iOS 的 navigator.standalone）
	if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
		// 获取所有带 .footer 类的元素
		var footers = document.querySelectorAll('.footer');

		footers.forEach(function(footer) {
			// 获取当前 .footer 的计算后背景颜色
			var computedStyle = window.getComputedStyle(footer);
			var bgColor = computedStyle.backgroundColor;

			// 创建一个新的 div 元素，设置高度为 30px，宽度与 .footer 同宽，背景色一致
			var spacer = document.createElement('div');
			spacer.style.height = '12px';
			spacer.style.width = '100%';
			spacer.style.backgroundColor = bgColor;

			// 将 spacer 插入到 .footer 元素之后
			footer.parentNode.insertBefore(spacer, footer.nextSibling);
		});
	}
});

document.addEventListener("DOMContentLoaded", function() {
	// 检查是否为 PWA 模式（包括 standalone 模式或 iOS 的 navigator.standalone）
	if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
		var fab = document.querySelector('.floating-action-buttons');
		if (fab) {
			// 设置固定定位，并调整距离底部为 50px
			fab.style.position = 'fixed';
			fab.style.bottom = '50px';
		}
	}
});


// 注册 Service Worker
if ('serviceWorker' in navigator) {
	window.addEventListener('load', function() {
		navigator.serviceWorker.register('/pwa.js')
			.then(function(registration) {
				console.log('Service Worker 已成功注册，作用域为: ', registration.scope);
			})
			.catch(function(err) {
				console.log('Service Worker 注册失败: ', err);
			});
	});
}

// 动态创建或更新 meta viewport 标签
function setViewportMeta() {
	let viewportMeta = document.querySelector('meta[name="viewport"]');
	if (!viewportMeta) {
		// 如果没有找到 viewport meta 标签，则创建一个新的
		viewportMeta = document.createElement('meta');
		viewportMeta.name = 'viewport';
		document.head.appendChild(viewportMeta);
	}
	// 强制更新或设置 content 属性
	viewportMeta.content =
		'width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0';
}

// 初始化 viewport 设置
setViewportMeta();

// 使用 MutationObserver 实时监测 <head> 标签中的变化
const observer = new MutationObserver(() => {
	setViewportMeta(); // 每当 <head> 发生变化时，调用 setViewportMeta 强制更新
});

// 配置 observer 监控 <head> 中的子节点变化
observer.observe(document.head, {
	childList: true, // 监控子节点的增加或删除
	subtree: true // 监控整个 <head> 树
});
