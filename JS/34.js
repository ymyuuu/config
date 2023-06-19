// 保存按钮点击事件处理函数
function onSave() {
  const input = $configuration.输入;
  
  if (input) {
    const [account, password, maxSteps, minSteps] = input.split('*');
    
    $persistentStore.write(account, '账号');
    $persistentStore.write(password, '密码');
    $persistentStore.write(minSteps, '最小步数');
    $persistentStore.write(maxSteps, '最大步数');
    
    runScript();
  } else {
    console.log('输入项不能为空');
    // 在此处可以添加适当的错误处理逻辑或通知用户输入项不能为空
  }
}

// 执行步数更改的脚本
function runScript() {
  const account = $persistentStore.read('账号');
  const password = $persistentStore.read('密码');
  const minSteps = $persistentStore.read('最小步数');
  const maxSteps = $persistentStore.read('最大步数');

  if (account && password && minSteps && maxSteps) {
    // 生成随机步数
    const steps = Math.floor(Math.random() * (parseInt(maxSteps) - parseInt(minSteps) + 1)) + parseInt(minSteps);

    const url = 'http://bs.svv.ink/index.php'; // 替换为实际的 URL

    const request = {
      url: url,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
      },
      body: `account=${account}&password=${password}&steps=${steps}`,
    };

    $httpClient.post(request, function (error, response, data) {
      if (error) {
        console.error('请求失败：', error);
        $notification.post('步数更改失败', '请求失败', error);
        $done();
      } else if (response.status === 200) {
        const jsonData = JSON.parse(data);
        console.log('步数更改成功：', jsonData);
        const modifiedSteps = jsonData.steps;
        const notificationTitle = '步数更改成功';
        const notificationSubtitle = `成功修改为 ${modifiedSteps} 步`;
        const notificationMessage = `步数更改成功，已修改为 ${modifiedSteps} 步`;
        $notification.post(notificationTitle, notificationSubtitle, notificationMessage);
        $done();
      } else {
        console.error('步数更改失败：', response.status);
        const notificationTitle = '步数更改失败';
        const notificationSubtitle = '失败';
        const notificationMessage = `状态码：${response.status}`;
        $notification.post(notificationTitle, notificationSubtitle, notificationMessage);
        $done();
      }
    });
  } else {
    console.log('无法获取有效的账号、密码、最小步数或最大步数');
    // 在此处可以添加适当的错误处理逻辑或通知用户无法获取有效的
