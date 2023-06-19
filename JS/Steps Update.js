// 作者 @YangMingyu https://t.me/ymyuuu

// 当你运行脚本时，请按照以下格式提供账号、密码、步数和通知选项的信息：

// 账号信息格式：账号和密码之间使用"@"符号分隔。例如：账号@密码。

// 步数范围格式：最大步数和最小步数之间使用"@"符号分隔。例如：最大步数@最小步数。确保最大步数大于等于最小步数。

// 通知选项格式：使用数字表示通知选项。以下是不同选项对应的数字：

// M：显示所有通知
// N：不显示任何通知
// 在运行脚本之前，按照以下步骤提供信息：

// 输入账号信息，以账号@密码的格式提供。
// 输入步数范围，以最大步数@最小步数的格式提供。
// 输入通知选项，使用对应的数字表示。
// 确保在提供信息时使用正确的格式，并确保输入的准确性和完整性。
// 例如，如果你的账号是example@gmail.com，密码是password123，最大步数是10000，最小步数是5000，通知选项是显示所有通知，那么你的输入将如下所示
// example@gmail.com@password123@10000@5000@M

// 读取key：YangMingyu
// 导入数据格式：账号@密码@最大步数@最小步数@通知选项


const savedData = $persistentStore.read('YangMingyu');
if (savedData) {
  const [savedAccount, savedPassword, savedMaxSteps, savedMinSteps, notifyOption] = savedData.split('@');
  if (savedAccount && savedPassword && savedMaxSteps && savedMinSteps && notifyOption) {
    account = savedAccount;
    password = savedPassword;
    maxSteps = parseInt(savedMaxSteps);
    minSteps = parseInt(savedMinSteps);
    notify = notifyOption === 'M';
  }
}

// 判断账号密码最大步数最小步数是否存在
if (!account) {
  console.error('缺少账号信息');
  if (notify) {
    $notification.post('步数更改失败', '缺少账号信息', '请检查账号');
  }
  $done();
}
if (!password) {
  console.error('缺少密码信息');
  if (notify) {
    $notification.post('步数更改失败', '缺少密码信息', '请检查密码');
  }
  $done();
}
if (!maxSteps) {
  console.error('缺少最大步数信息');
  if (notify) {
    $notification.post('步数更改失败', '缺少最大步数信息', '请检查最大步数');
  }
  $done();
}
if (!minSteps) {
  console.error('缺少最小步数信息');
  if (notify) {
    $notification.post('步数更改失败', '缺少最小步数信息', '请检查最小步数');
  }
  $done();
}

// 判断最大步数和最小步数是否超限
if (maxSteps > 98000 || minSteps > 98000) {
  console.log('最大步数和最小步数不能超过98000');
  if (notify) {
    $notification.post('步数更改失败', '最大步数和最小步数不能超过98000', '请检查最大步数和最小步数');
  }
  $done();
} else if (maxSteps < minSteps) {
  console.log('最大步数不能小于最小步数');
  if (notify) {
    $notification.post('步数更改失败', '最大步数不能小于最小步数', '请检查最大步数和最小步数');
  }
  $done();
} else if (minSteps > maxSteps) {
  console.log('最小步数不能大于最大步数');
  if (notify) {
    $notification.post('步数更改失败', '最小步数不能大于最大步数', '请检查最大步数和最小步数');
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
      console.log(`Steps Update Successful: ${randomSteps.toString()}`, jsonData);
      if (notify) {
        $notification.post('Steps Update Successful', `Steps: ${randomSteps.toString()}`, '@YangMingyu', 'https://t.me/ymyuuu');
      }
      $done();
    } else {
      console.error('步数更改失败：', response.status);
      if (notify) {
        $notification.post('步数更改失败', '失败', `状态码：${response.status}`);
      }
      if (notify) {
        $done();
      }
    }
  });

  const newData = `${account}@${password}@${maxSteps}@${minSteps}@${notify ? 'M' : 'N'}`;
  $persistentStore.write(newData, 'YangMingyu').then(() => {
    console.log('写入成功');
  }, () => {
    console.log('写入失败');
  });
}
