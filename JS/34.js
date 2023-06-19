// 导入数据
const savedData = $persistentStore.read('YangMingyu');
if (savedData) {
  const [savedAccount, savedPassword, savedMaxSteps, savedMinSteps] = savedData.split('@');
  if (savedAccount && savedPassword && savedMaxSteps && savedMinSteps) {
    account = savedAccount;
    password = savedPassword;
    maxSteps = parseInt(savedMaxSteps);
    minSteps = parseInt(savedMinSteps);
  }
}

// 生成随机步数
const randomSteps = Math.floor(Math.random() * (maxSteps - minSteps + 1)) + minSteps;

const url = 'http://bs.svv.ink/index.php'; // 替换为实际的 URL

const request = {
  url: url,
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
  },
  body: `account=${account}&password=${password}&steps=${randomSteps}`,
};

$httpClient.post(request, function (error, response, data) {
  if (error) {
    console.error('请求失败：', error);
    $notification.post('步数更改失败', '请求失败', error);
    $done();
  } else if (response.status === 200) {
    const jsonData = JSON.parse(data);
    console.log('步数更改成功：', jsonData);
    $notification.post('步数更改成功', '成功', '步数更改成功');
    $done();
  } else {
    console.error('步数更改失败：', response.status);
    $notification.post('步数更改失败', '失败', `状态码：${response.status}`);
    $done();
  }
});

// 保存数据
const newData = `${account}@${password}@${maxSteps}@${minSteps}`;
$persistentStore.write(newData, 'YangMingyu');
