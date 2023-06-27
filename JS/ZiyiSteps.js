const maxRetries = 3; // 最大重试次数
const retryDelay = 5000; // 重试延迟时间（毫秒）
const maxRunCount = 10; // 最大运行次数

let runCount = 0; // 运行次数计数器

function checkAndNotifyFailure(message) {
  console.log(message);
  // 添加错误日志输出
  console.error(message);
  if (notify) {
    $notification.post('步数更改失败', message, '请检查相应信息');
  }
  $done();
}

function checkRequiredVariables(...variables) {
  // 检查必需的变量是否存在
  for (const variable of variables) {
    if (!variable) {
      checkAndNotifyFailure(`缺少${variable}信息`);
      return false;
    }
  }
  return true;
}

function updateSteps(retries = 0) {
  runCount++; // 增加运行次数计数器

  console.log(`正在运行第 ${runCount} 次`);

  const savedData = $persistentStore.read('Ziyi');
  if (savedData) {
    const [savedAccount, savedPassword, savedMaxSteps, savedMinSteps, notifyOption] = savedData.split('@');
    if (checkRequiredVariables(savedAccount, savedPassword, savedMaxSteps, savedMinSteps, notifyOption)) {
      account = savedAccount;
      password = savedPassword;
      maxSteps = parseInt(savedMaxSteps);
      minSteps = parseInt(savedMinSteps);
      notify = notifyOption === 'M';
    }
  }

  if (
    checkRequiredVariables(account, password, maxSteps, minSteps) &&
    maxSteps <= 98000 &&
    minSteps <= 98000 &&
    maxSteps >= minSteps
  ) {
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
      if (error || response.status !== 200) {
        console.log('请求失败：', error || response.status);
        // 检查重试次数是否超过最大重试次数
        if (retries < maxRetries) {
          // 在重试之前添加延迟
          setTimeout(() => {
            // 增加重试次数并调用updateSteps函数进行重试
            const nextRetry = retries + 1;
            updateSteps(nextRetry);
          }, retryDelay); // 在重试之前等待重试延迟时间
        } else {
          console.log('重试次数超过最大限制');
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

  if (runCount === maxRunCount) {
    console.log('已运行10次，结束程序');
    return;
  }

  // 在下一次运行前添加延迟
  setTimeout(() => {
    updateSteps(retries);
  }, retryDelay); // 在下一次运行前等待重试延迟时间
}

// 调用函数开始更新步数
updateSteps();
