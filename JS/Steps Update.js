const accountKey = 'account';
const passwordKey = 'password';
const maxStepsKey = 'maxSteps';
const minStepsKey = 'minSteps';
const notifyKey = 'notify';

const savedAccount = $persistentStore.read(accountKey);
const savedPassword = $persistentStore.read(passwordKey);
const savedMaxSteps = $persistentStore.read(maxStepsKey);
const savedMinSteps = $persistentStore.read(minStepsKey);
const notifyOption = $persistentStore.read(notifyKey);

// ...

if (!savedAccount) {
  $notification.post('缺少账号信息', '', '');
  console.log('缺少账号信息');
  $done();
}

// ...

if (!notifyOption || (notifyOption !== 'M' && notifyOption !== 'N')) {
  $notification.post('通知策略错误', '通知策略必须是 M 或 N', '');
  console.log('通知策略错误');
  $done();
}

// ...

if (maxSteps > 98000 || minSteps > 98000 || maxSteps < minSteps) {
  $notification.post('步数范围错误', '最大步数不能超过98000且必须大于等于最小步数', '');
  console.log('步数范围错误');
  if (notify) {
    $done();
  }
} else {
  // ...

  const request = {
    url: url,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    },
    body: `account=${account}&password=${password}&steps=${randomSteps.toString()}&max_steps=${maxSteps.toString()}&min_steps=${minSteps.toString()}`,
  };

  $httpClient.post(request, function (error, response, data) {
    if (error) {
      $notification.post('请求失败', error, '');
      console.log('请求失败', error);
      if (notify) {
        $done();
      }
    } else if (response.status === 200) {
      const jsonData = JSON.parse(data);
      $notification.post('步数更新成功', `随机步数: ${randomSteps.toString()}`, jsonData);
      console.log('步数更新成功', `随机步数: ${randomSteps.toString()}`, jsonData);
      if (notify) {
        $done();
      }
    } else {
      $notification.post('步数更改失败', `失败状态码: ${response.status}`, '');
      console.log('步数更改失败', `失败状态码: ${response.status}`);
      if (notify) {
        $done();
      }
    }
  });
}
