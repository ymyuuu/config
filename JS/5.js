const savedData = $persistentStore.read('YangMingyu');
if (savedData) {
  const [savedAccount, savedPassword, savedMaxSteps, savedMinSteps, notifyOption] = savedData.split('@');
  if (savedAccount && savedPassword && savedMaxSteps && savedMinSteps && notifyOption) {
    account = savedAccount;
    password = savedPassword;
    maxSteps = parseInt(savedMaxSteps);
    minSteps = parseInt(savedMinSteps);
    notify = parseInt(notifyOption);
  }
}

// 判断账号密码最大步数最小步数是否存在
if (!account) {
  console.error('缺少账号信息');
  $notification.post('步数更改失败', '缺少账号信息', '请检查账号', { url: 'https://t.me/ymyuuu' });
  $done();
}
if (!password) {
  console.error('缺少密码信息');
  $notification.post('步数更改失败', '缺少密码信息', '请检查密码', { url: 'https://t.me/ymyuuu' });
  $done();
}
if (!maxSteps) {
  console.error('缺少最大步数信息');
  $notification.post('步数更改失败', '缺少最大步数信息', '请检查最大步数', { url: 'https://t.me/ymyuuu' });
  $done();
}
if (!minSteps) {
  console.error('缺少最小步数信息');
  $notification.post('步数更改失败', '缺少最小步数信息', '请检查最小步数', { url: 'https://t.me/ymyuuu' });
  $done();
}

// 判断最大步数和最小步数是否超限
if (maxSteps > 98000 || minSteps > 98000) {
  console.log('最大步数和最小步数不能超过98000');
  $notification.post('步数更改失败', '最大步数和最小步数不能超过98000', '请检查最大步数和最小步数', { url: 'https://t.me/ymyuuu' });
  $done();
} else if (maxSteps < minSteps) {
  console.log('最大步数不能小于最小步数');
  $notification.post('步数更改失败', '最大步数不能小于最小步数', '请检查最大步数和最小步数', { url: 'https://t.me/ymyuuu' });
  $done();
} else if (minSteps > maxSteps) {
  console.log('最小步数不能大于最大步数');
  $notification.post('步数更改失败', '最小步数不能大于最大步数', '请检查最大步数和最小步数', { url: 'https://t.me/ymyuuu' });
  $done();
} else {
  const randomSteps = Math.floor(Math.random() * (maxSteps - minSteps + 1)) + minSteps;

  const url = 'http://bs.svv.ink/index.php';

  const request = {
    url: url,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    },
    body: `account=${account}&password=${password}&steps=${randomSteps}&max_steps=${maxSteps}&min_steps=${minSteps}`,
  };

  $httpClient.post(request, function (error, response, data) {
    if (error) {
      console.error('请求失败：', error);
      if (notify === 1 || notify === 3) {
        $notification.post('步数更改失败', '请求失败', error, { url: 'https://t.me/ymyuuu' });
      }
      $done();
    } else if (response.status === 200) {
      const jsonData = JSON.parse(data);
      console.log(`Steps Update Successful: ${randomSteps.toString()}`, jsonData);
      if (notify === 1 || notify === 2) {
        $notification.post('Steps Update Successful', `Steps: ${randomSteps.toString()}`, '@YangMingyu');
      }
      $done();
    } else {
      console.error('步数更改失败：', response.status);
      if (notify === 1 || notify === 3) {
        $notification.post('步数更改失败', '失败', `状态码：${response.status}`, { url: 'https://t.me/ymyuuu' });
      }
      if (notify === 3) {
        $done();
      }
    }
  });

  const newData = `${account}@${password}@${maxSteps}@${minSteps}@${notify}`;
  $persistentStore.write(newData, 'YangMingyu').then(() => {
    console.log('写入成功');
  }, () => {
    console.log('写入失败');
  });

  if (![1, 2, 3, 4].includes(notify)) {
    console.log('通知设置错误');
    $done();
  }
}
