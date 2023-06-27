const maxRunCount = 10; // 最大运行次数
let runCount = 0; // 运行次数计数器

function checkAndNotifyFailure(message) {
  console.log(message);
  // 添加错误日志输出
  console.error(message);
  $notification.post('步数更改失败', message, '请检查相应信息');
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

function updateSteps() {
  runCount++; // 增加运行次数计数器

  console.log(`正在运行第 ${runCount} 次`);

  const savedData = $persistentStore.read('Ziyi');
  if (!savedData) {
    checkAndNotifyFailure('缺少存储的信息');
    return;
  }

  const [savedAccount, savedPassword, savedMaxSteps, savedMinSteps, notifyOption] = savedData.split('@');
  if (!checkRequiredVariables(savedAccount, savedPassword, savedMaxSteps, savedMinSteps, notifyOption)) {
    return;
  }

  const account = savedAccount;
  const password = savedPassword;
  const maxSteps = parseInt(savedMaxSteps);
  const minSteps = parseInt(savedMinSteps);
  const notify = notifyOption === 'M';

  if (maxSteps <= 98000 && minSteps <= 98000 && maxSteps >= minSteps) {
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

    const start = Date.now(); // 记录开始时间

    $httpClient.post(request, function (error, response, data) {
      const duration = Date.now() - start; // 计算请求耗时

      if (duration > 5000) {
        console.log('请求超时');
        $done();
        return;
      }

      if (error || response.status !== 200) {
        console.log('请求失败：', error || response.status);
        if (runCount === maxRunCount) {
          console.log('已运行10次，步数更改失败');
          $notification.post('步数更改失败', '连续10次步数更改失败', '请检查相应信息');
        }
        return;
      }

      const jsonData = JSON.parse(data);
      console.log(`步数更新成功：${randomSteps.toString()}`, jsonData);
      if (notify) {
        $notification.post('Steps Update Successful', `Steps: ${randomSteps.toString()}`, '@ZhangZiyi', 'https://t.me/ymyuuu');
      }

      if (runCount < maxRunCount) {
        setTimeout(updateSteps, 5000 - duration); // 等待剩余时间后继续下一次运行
      }
    });

    const newData = `${account}@${password}@${maxSteps}@${minSteps}@${notify ? 'M' : 'N'}`;
    $persistentStore.write(newData, 'YangMingyu').then(() => {
      console.log('写入成功');
    }, () => {
      console.log('写入失败');
    });
  } else {
    checkAndNotifyFailure('步数范围设置错误');
  }
}

// 调用函数开始更新步数
updateSteps();
