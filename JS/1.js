// 创建XMLHttpRequest对象
var xhr = new XMLHttpRequest();

// 监听状态改变事件
xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
        // 请求完成
        if (xhr.status === 200) {
            // 响应成功
            console.log(xhr.responseText);
        } else {
            // 响应失败
            console.log('请求失败：' + xhr.status);
        }
    }
};

// 设置请求信息
xhr.open('POST', 'http://bs.svv.ink/index.php', true);
xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

// 设置请求体参数
var params = 'account=' + encodeURIComponent('15033296069') +
    '&password=' + encodeURIComponent('20030101h') +
    '&steps=' + encodeURIComponent('80000'); // 这里假设步数为10000

// 发送请求
xhr.send(params);
