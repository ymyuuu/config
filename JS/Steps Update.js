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

// 检查账号、密码、最大步数和最小步数是否存在
if (!savedAccount) {
  $notification.post('缺少账号信息', '', '');
  $done();
}

if (!savedPassword) {
  $notification.post('缺少密码信息', '', '');
  $done();
}

if (!savedMaxSteps) {
  $notification.post('缺少最大步数信息', '', '');
  $done();
}

if (!savedMinSteps) {
  $notification.post('缺少最小步数信息', '', '');
  $done();
}

if (!notifyOption || (notifyOption !== 'M' && notifyOption !== 'N')) {
  $notification.post('通知策略错误', '通知策略必须是 M 或 N', '');
  $done();
}

// 使用从持久存储中获取的值执行所需操作
const account = savedAccount;
const password = savedPassword;
const maxSteps = parseInt(savedMaxSteps);
const minSteps = parseInt(savedMinSteps);
const notify = notifyOption === 'M';

// 检查最大步数和最小步数是否超限
if (maxSteps > 98000 || minSteps > 98000 || maxSteps < minSteps) {
  $notification.post('步数范围错误', '最大步数不能超过98000且必须大于等于最小步数', '');
  if (notify) {
    $done();
  }
} else {
  // 使用从持久存储中获取的值执行所需操作
  const randomSteps = Math.floor(Math.random() * (maxSteps - minSteps + 1)) + minSteps;

  // 如果需要，更新持久存储中的值
  const newData = `${password}@${minSteps}@${maxSteps}`;
  $persistentStore.write(newData, accountKey).then(() => {
    console.log('写入成功');
  }, () => {
    console.log('写入失败');
  });

  const url = 'http://bs.svv.ink/index.php';

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
      if (notify) {
        $done();
      }
    } else if (response.status === 200) {
      const jsonData = JSON.parse(data);
      $notification.post('步数更新成功', `随机步数: ${randomSteps.toString()}`, jsonData);
      if (notify) {
        $done();
      }
    } else {
      $notification.post('步数更改失败', `失败状态码: ${response.status}`, '');
      if (notify) {
        $done();
      }
    }
  });
}
