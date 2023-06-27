const maxRetries = 3; // 最大重试次数
let runCount = 0; // 运行计数器

function updateSteps(retries = 0) {
  runCount++;
  console.log(`正在运行第 ${runCount} 次`);

  const savedData = $persistentStore.read('Ziyi');
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
    console.log('缺少账号信息');
    if (notify) {
      $notification.post('步数更改失败', '缺少账号信息', '请检查账号');
    }
    $done();
  }
  if (!password) {
    console.log('缺少密码信息');
    if (notify) {
      $notification.post('步数更改失败', '缺少密码信息', '请检查密码');
    }
    $done();
  }
  if (!maxSteps) {
    console.log('缺少最大步数信息');
    if (notify) {
      $notification.post('步数更改失败', '缺少最大步数信息', '请检查最大步数');
    }
    $done();
  }
  if (!minSteps) {
    console.log('缺少最小步数信息');
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

    // 添加账号密码验证
    if (!validateAccountAndPassword(account, password)) {
      console.log('账号密码验证失败');
      if (notify) {
        $notification.post('步数更改失败', '账号密码验证失败', '请检查账号和密码');
      }
      $done();
    }

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
      if (error || response.status !== 200) {
        console.error('请求失败：', error || response.status);
        if (notify) {
          $notification.post('步数更改失败', '请求失败', error || response.status);
        }
        // 检查重试次数是否超过最大重试次数
        if (retries < maxRetries) {
          // 在重试之前添加延迟
          setTimeout(() => {
            // 增加重试次数并调用updateSteps函数进行重试
            const nextRetry = retries + 1;
            updateSteps(nextRetry);
          }, 5000); // 在重试之前等待5秒
        } else {
          console.error('重试次数超过最大限制');
          if (notify) {
            $notification.post('步数更改失败', '重试次数超过最大限制', '请稍后再试');
          }
          $done();
        }
      } else {
        const jsonData = JSON.parse(data);
        console.log(`步数更新成功：${randomSteps.toString()}`, jsonData);
        if (notify) {
          $notification.post('Steps Update Successful', `Steps: ${randomSteps.toString()}`, '@ZhangZiyi', 'https://t.me/ymyuuu');
        }
        $done();
      }
    });

    const newData = `${account}@${password}@${maxSteps}@${minSteps}@${notify ? 'M' : 'N'}`;
    $persistentStore.write(newData, 'YangMingyu').then(() => {
      console.log('写入成功');
    }, () => {
      console.log('写入失败');
    });
  }
}

// 账号密码验证函数
function validateAccountAndPassword(account, password) {
  // 构造验证接口请求
  const validateUrl = 'https://example.com/api/validate'; // 替换为实际的验证接口地址
  const validateRequest = {
    url: validateUrl,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      account: account,
      password: password,
    }),
  };

  // 发送验证请求
  const validateResponse = $httpClient.post(validateRequest);

  // 解析验证结果
  if (validateResponse.status === 200) {
    const validateData = JSON.parse(validateResponse.body);
    if (validateData.valid) {
      return true; // 账号密码验证通过
    }
  }

  return false; // 账号密码验证失败
}

// 调用函数开始更新步数
for (let i = 0; i < 10; i++) {
  updateSteps();
}
