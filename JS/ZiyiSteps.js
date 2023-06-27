const maxRetries = 3; // 最大重试次数
const delay = 5000; // 重试延迟时间
const accountInfoKey = 'Ziyi'; // 账号信息在存储中的键名
const userInfoKey = 'YangMingyu'; // 用户信息在存储中的键名

let runCount = 0; // 运行次数计数器

// 通知
function sendNotification(title, subtitle, message) {
  if (notify) {
    $notification.post(title, subtitle, message);
  }
}

// 检查配置信息
function checkConfig() {
  if (!account) {
    console.log('缺少账号信息');
    sendNotification('步数更改失败', '缺少账号信息', '请检查账号');
    return false;
  }
  if (!password) {
    console.log('缺少密码信息');
    sendNotification('步数更改失败', '缺少密码信息', '请检查密码');
    return false;
  }
  if (!maxSteps) {
    console.log('缺少最大步数信息');
    sendNotification('步数更改失败', '缺少最大步数信息', '请检查最大步数');
    return false;
  }
  if (!minSteps) {
    console.log('缺少最小步数信息');
    sendNotification('步数更改失败', '缺少最小步数信息', '请检查最小步数');
    return false;
  }
  if (maxSteps > 98000 || minSteps > 98000) {
    console.log('最大步数和最小步数不能超过98000');
    sendNotification('步数更改失败', '最大步数和最小步数不能超过98000', '请检查最大步数和最小步数');
    return false;
  }
  if (maxSteps < minSteps) {
    console.log('最大步数不能小于最小步数');
    sendNotification('步数更改失败', '最大步数不能小于最小步数', '请检查最大步数和最小步数');
    return false;
  }
  if (minSteps > maxSteps) {
    console.log('最小步数不能大于最大步数');
    sendNotification('步数更改失败', '最小步数不能大于最大步数', '请检查最大步数和最小步数');
    return false;
  }
  return true;
}

// 发送请求
function sendRequest(retries) {
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

  return new Promise((resolve, reject) => {
    $httpClient.post(request, function (error, response, data) {
      if (error || response.status !== 200) {
        console.log('请求失败：', error || response.status);
        sendNotification('步数更改失败', '请求失败', error || response.status);

        // 检查重试次数是否超过最大重试次数
        if (retries < maxRetries) {
          // 在重试之前添加延迟
          setTimeout(() => {
            // 增加重试次数并发送请求
            const nextRetry = retries + 1;
            resolve(sendRequest(nextRetry));
          }, delay);
        } else {
          console.log('重试次数超过最大限制');
          sendNotification('步数更改失败', '重试次数超过最大限制', '请稍后再试');
          reject('重试次数超过最大限制');
        }
      } else {
        const jsonData = JSON.parse(data);
        console.log(`步数更新成功：${randomSteps.toString()}`, jsonData);
        sendNotification('Steps Update Successful', `Steps: ${randomSteps.toString()}`, '@ZhangZiyi', 'https://t.me/ymyuuu');
        resolve();
      }
    });
  });
}

// 更新步数
async function updateSteps(retries = 0) {
  runCount++; // 增加运行次数计数器
  console.log(`正在运行第 ${runCount} 次`);

  // 读取存储的用户信息
  const savedData = $persistentStore.read(accountInfoKey);
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

  // 检查配置信息
  if (!checkConfig()) {
    $done();
    return;
  }

  try {
    await sendRequest(retries);
  } catch (error) {
    console.log('请求失败：', error);
  }

  // 保存用户信息
  const newData = `${account}@${password}@${maxSteps}@${minSteps}@${notify ? 'M' : 'N'}`;
  $persistentStore.write(newData, userInfoKey).then(() => {
    console.log('写入成功');
  }, () => {
    console.log('写入失败');
  });

  if (runCount === 10) {
    console.log('已运行10次，结束程序');
    return;
  }

  // 在下一次运行前添加延迟
  setTimeout(() => {
    updateSteps(retries);
  }, delay);
}

// 调用函数开始更新步数
updateSteps();
