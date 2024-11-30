document.addEventListener('DOMContentLoaded', function() {
    // 暗色主题的样式表链接
    const darkThemeLink = 'https://cdn.jsdelivr.net/gh/Sight-wcg/layui-theme-dark@master/dist/layui-theme-dark.css';

    // 获取当前时间并转为北京时间（UTC+8）
    function getBeijingTime() {
        const now = new Date();
        return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' })).toLocaleString();
    }

    // 获取当前主题状态，并应用
    function applyTheme() {
        const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const existingLink = document.querySelector('link[href*="layui-theme-dark"]');
        
        // 获取北京时间
        const beijingTime = getBeijingTime();
        const theme = isDarkMode ? '暗色模式' : '亮色模式';

        // 输出当前主题和北京时间
        console.log(`[${beijingTime}] 当前主题: ${theme}`);
        
        // 应用或移除暗色主题样式
        if (isDarkMode && !existingLink) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = darkThemeLink;
            document.head.appendChild(link);
        } else if (!isDarkMode && existingLink) {
            existingLink.remove();
        }
    }

    // 初始应用主题
    applyTheme();

    // 监听系统主题变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
});
