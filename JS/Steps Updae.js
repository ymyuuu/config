const savedAccount = $persistentStore.read('Account');
const savedPassword = $persistentStore.read('Password');
const savedMaxSteps = $persistentStore.read('MaxSteps');
const savedMinSteps = $persistentStore.read('MinSteps');
const savedNotifyOption = $persistentStore.read('NotifyOption');

if (!(savedAccount && savedPassword && savedMaxSteps && savedMinSteps && savedNotifyOption)) {
  console.error('缺少账号信息');
  if (savedNotifyOption === 'M') {
    $notification.post('步数更改失败', '缺少信息', '请填写完整信息');
  }
  $done();
}

const account = savedAccount;
const password = savedPassword;
const maxSteps = parseInt(savedMaxSteps);
const minSteps = parseInt(savedMinSteps);
const notify = savedNotifyOption === 'M';

// 检查最大步数和最小步数是否超过限制
if (maxSteps > 98000 || minSteps > 98000) {
  console.error('最大步数和最小步数不能超过98000');
  if (notify) {
    $notification.post('步数更改失败', '步数范围错误', '最大步数和最小步数不能超过98000');
  }
  $done();
} else if (maxSteps < minSteps) {
  console.error('最大步数不能小于最小步数');
  if (notify) {
    $notification.post('步数更改失败', '步数范围错误', '最大步数不能小于最小步数');
  }
  $done();
} else if (minSteps > maxSteps) {
  console.error('最小步数不能大于最大步数');
  if (notify) {
    $notification.post('步数更改失败', '步数范围错误', '最小步数不能大于最大步数');
  }
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
      if (notify) {
        $notification.post('步数更改失败', '请求失败', error);
      }
      $done();
    } else if (response.status === 200) {
      const jsonData = JSON.parse(data);
      console.log(`步数更改成功: ${randomSteps.toString()}`, jsonData);
      if (notify) {
        $notification.post('步数更改成功', `步数: ${randomSteps.toString()}`, '@YourUsername', 'https://t.me/yourchannel');
      }
      $done();
    } else {
      console.error('步数更改失败：', response.status);
      if (notify) {
        $notification.post('步数更改失败', '失败', `状态码：${response.status}`);
      }
      $done();
    }
  });
}
