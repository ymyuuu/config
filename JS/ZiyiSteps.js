const maxRunCount = 10; // 最大运行次数
let runCount = 0; // 运行次数计数器


function handleError(message) {
  console.log(message);
  if (notify) {
    $notification.post('步数更改失败', message, '');
  }
}

async function updateSteps() {
  runCount++; // 增加运行次数计数器

  console.log(`正在运行第 ${runCount} 次`);

  const savedData = $persistentStore.read('Ziyi');
  if (!savedData) {
    handleError('缺少账号信息');
    $done();
    return;
  }

  const [savedAccount, savedPassword, savedMaxSteps, savedMinSteps, notifyOption] = savedData.split('@');
  const requiredInfo = [savedAccount, savedPassword, savedMaxSteps, savedMinSteps];
  const requiredInfoNames = ['账号信息', '密码信息', '最大步数信息', '最小步数信息'];

  for (let i = 0; i < requiredInfo.length; i++) {
    if (!requiredInfo[i]) {
      handleError(`缺少${requiredInfoNames[i]}`);
      $done();
      return;
    }
  }

  const account = savedAccount;
  const password = savedPassword;
  const maxSteps = parseInt(savedMaxSteps);
  const minSteps = parseInt(savedMinSteps);
  const notify = notifyOption === 'M';

  if (maxSteps > 98000 || minSteps > 98000) {
    handleError('最大步数和最小步数不能超过98000');
    $done();
    return;
  } else if (maxSteps < minSteps) {
    handleError('最大步数不能小于最小步数');
    $done();
    return;
  } else if (minSteps > maxSteps) {
    handleError('最小步数不能大于最大步数');
    $done();
    return;
  }

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

  try {
    const response = await $httpClient.post(request);
    const jsonData = JSON.parse(response.data);
    console.log(`步数更新成功：${randomSteps.toString()}`, jsonData);
    if (notify) {
      $notification.post('Steps Update Successful', `Steps: ${randomSteps.toString()}`, '@ZhangZiyi', 'https://t.me/ymyuuu');
    }
  } catch (error) {
    console.log('请求失败：', error);
    // 无需通知，只在控制台显示错误信息
  }

  const newData = `${account}@${password}@${maxSteps}@${minSteps}@${notify ? 'M' : 'N'}`;
  $persistentStore.write(newData, 'YangMingyu').then(() => {
    console.log('写入成功');
  }, () => {
    console.log('写入失败');
  });

  if (runCount === maxRunCount) {
    console.log('已运行10次，结束程序');
    return;
  }

  // 在下一次运行前添加延迟
  setTimeout(() => {
    updateSteps();
  }, 5000); // 在下一次运行前等待5秒
}

// 调用函数开始更新步数
updateSteps();
