

// 解析输入的配置
function parseInputConfig(inputConfig) {
  const configArray = inputConfig.split('*');
  if (configArray.length === 4) {
    const account = configArray[0].trim();
    const password = configArray[1].trim();
    const maxSteps = parseInt(configArray[2].trim());
    const minSteps = parseInt(configArray[3].trim());

    if (account && password && !isNaN(maxSteps) && !isNaN(minSteps)) {
      $persistentStore.write(account, '账号');
      $persistentStore.write(password, '密码');
      $persistentStore.write(maxSteps.toString(), '最大步数');
      $persistentStore.write(minSteps.toString(), '最小步数');

      runScript();
    } else {
      console.log('配置项不完整或步数不是有效数字');
      // 在此处可以添加适当的错误处理逻辑或通知用户配置项不完整或步数无效
    }
  } else {
    console.log('输入格式不正确');
    // 在此处可以添加适当的错误处理逻辑或通知用户输入格式不正确
  }
}

// 执行步数更改的脚本
function runScript() {
  const account = $persistentStore.read('账号');
  const password = $persistentStore.read('密码');
  const maxSteps = parseInt($persistentStore.read('最大步数'));
  const minSteps = parseInt($persistentStore.read('最小步数'));

  if (account && password && !isNaN(maxSteps) && !isNaN(minSteps)) {
    // 生成随机步数
    const steps = Math.floor(Math.random() * (maxSteps - minSteps + 1)) + minSteps;

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
    // 在此处可以添加适当的错误处理逻辑或通知用户无法获取有效的账号、密码、最小步数或最大步数
  }
}

// 获取输入的配置项
const inputConfig = $configuration.inputConfig;

// 解析并处理输入的配置项
parseInputConfig(inputConfig);

// 注册保存按钮点击事件处理函数
$configuration.onSave = function () {
  const inputConfig = $configuration.inputConfig;
  parseInputConfig(inputConfig);
};
