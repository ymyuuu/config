const maxRunCount = 10; // 最大运行次数

let runCount = 0; // 运行次数计数器

async function updateSteps() {
  runCount++; // 增加运行次数计数器

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
  if (!account || !password || !maxSteps || !minSteps) {
    console.log('缺少必要信息');
    if (notify) {
      $notification.post('步数更改失败', '缺少必要信息', '请检查账号、密码、最大步数和最小步数');
    }
    $done();
    return;
  }

  // 判断最大步数和最小步数是否超限
  if (maxSteps > 98000 || minSteps > 98000 || maxSteps < minSteps || minSteps > maxSteps) {
    console.log('步数范围设置错误');
    if (notify) {
      $notification.post('步数更改失败', '步数范围设置错误', '请检查最大步数和最小步数');
    }
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
    if (notify) {
      $notification.post('步数更改失败', '请求失败', error);
    }
    if (runCount < maxRunCount) {
      setTimeout(updateSteps, 5000); // 在下一次运行前等待5秒
    } else {
      console.log('运行次数达到上限');
      if (notify) {
        $notification.post('步数更改失败', '运行次数达到上限', '请稍后再试');
      }
    }
  }

  const newData = `${account}@${password}@${maxSteps}@${minSteps}@${notify ? 'M' : 'N'}`;
  try {
    await $persistentStore.write(newData, 'YangMingyu');
    console.log('写入成功');
  } catch {
    console.log('写入失败');
  }

  if (runCount < maxRunCount) {
    setTimeout(updateSteps, 5000); // 在下一次运行前等待5秒
  } else {
    console.log('已运行10次，结束程序');
  }
}

// 调用函数开始更新步数
updateSteps();
