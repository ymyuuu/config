document.addEventListener('DOMContentLoaded', function() {
    // 暗色主题的样式表链接
    const darkThemeLink = 'https://cdn.jsdelivr.net/gh/Sight-wcg/layui-theme-dark@master/dist/layui-theme-dark.css';
    
    // 应用主题的函数
    function applyTheme() {
        // 检查用户是否选择暗色模式
        const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        // 查找是否已经存在暗色主题的链接
        const existingLink = document.querySelector('link[href*="layui-theme-dark"]');
        
        // 如果是暗色模式且尚未添加主题样式，则添加
        if (isDarkMode && !existingLink) {
            const link = document.createElement('link'); // 创建新的 link 元素
            link.rel = 'stylesheet'; // 设置 rel 属性
            link.href = darkThemeLink; // 设置 href 属性为暗色主题链接
            document.head.appendChild(link); // 将 link 添加到文档头部
            console.log('已应用暗色主题'); // 输出日志
        } 
        // 如果是明亮模式且已经存在暗色主题链接，则移除
        else if (!isDarkMode && existingLink) {
            existingLink.remove(); // 移除已有的暗色主题链接
            console.log('已移除暗色主题'); // 输出日志
        }
    }

    // 初始应用主题
    applyTheme();

    // 监听主题变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
});
