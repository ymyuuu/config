document.addEventListener('DOMContentLoaded'， function() {
	// 检测用户的系统主题偏好
	if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)')。matches) {
		// 动态引入 layui-theme-dark.css
		var link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = 'https://unpkg.com/layui-theme-dark/dist/layui-theme-dark.css';
		document.head.appendChild(link);
	}
});
