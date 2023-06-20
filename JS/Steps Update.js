const savedAccount = $persistentStore.read('Account');
const savedPassword = $persistentStore.read('Password');
const savedMaxSteps = $persistentStore.read('MaxSteps');
const savedMinSteps = $persistentStore.read('MinSteps');
const savedNotifyOption = $persistentStore.read('NotifyOption');

// 检查账号信息是否存在
if (!savedAccount) {
  console.error('缺少账号信息');
  $notification.post('步数更改失败'， '缺少账号信息'， '请检查账号');
  $done();
}

// 检查密码信息是否存在
if (!savedPassword) {
  console.error('缺少密码信息');
  $notification.post('步数更改失败'， '缺少密码信息'， '请检查密码');
  $done();
}

// 检查最大步数信息是否存在
if (!savedMaxSteps) {
  console.error('缺少最大步数信息');
  $notification.post('步数更改失败'， '缺少最大步数信息'， '请检查最大步数');
  $done();
}

// 检查最小步数信息是否存在
if (!savedMinSteps) {
  console.error('缺少最小步数信息');
  $notification.post('步数更改失败'， '缺少最小步数信息'， '请检查最小步数');
  $done();
}

// 解析存储的值
const account = savedAccount;
const password = savedPassword;
const maxSteps = parseInt(savedMaxSteps);
const minSteps = parseInt(savedMinSteps);
const notifyOption = savedNotifyOption;

// 检查最大步数和最小步数是否符合逻辑
if (maxSteps > 98000 || maxSteps < minSteps) {
  console.error('步数范围设置错误');
  $notification.post('步数更改失败', '步数范围设置错误', '请检查最大步数和最小步数');
  $done();
}

// 检查通知选项是否为M或N
if (notifyOption !== 'M' && notifyOption !== 'N') {
  console.error('通知选项只能为M或N');
  $notification.post('步数更改失败', '通知选项只能为M或N', '请检查通知选项');
  $done();
}

// 运行步数更改脚本
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
    $notification.post('步数更改失败', '请求失败', error);
    $done();
  } else if (response.status === 200) {
    const jsonData = JSON.parse(data);
    console.log(`步数更新成功：${randomSteps.toString()}`, jsonData);
    $notification.post('步数更新成功', `步数：${randomSteps.toString()}`, '@YangMingyu', 'https://t.me/ymyuuu');
    $done();
  } else {
    console.error('步数更改失败：', response.status);
    $notification.post('步数更改失败', '失败', `状态码：${response.status}`);
    $done();
  }
});

// 保存更新后的值
const newData = `${account}`;
$persistentStore.write(newData, 'Account').then(() => {
  console.log('账号信息保存成功');
}, () => {
  console.log('账号信息保存失败');
});

const newData = `${password}`;
$persistentStore.write(newData, 'Password').then(() => {
  console.log('密码信息保存成功');
}, () => {
  console.log('密码信息保存失败');
});

const newData = `${maxSteps}`;
$persistentStore.write(newData, 'MaxSteps').then(() => {
  console.log('最大步数信息保存成功');
}, () => {
  console.log('最大步数信息保存失败');
});

const newData = `${minSteps}`;
$persistentStore.write(newData, 'MinSteps').then(() => {
  console.log('最小步数信息保存成功');
}, () => {
  console.log('最小步数信息保存失败');
});

const newData = `${notifyOption}`;
$persistentStore.write(newData, 'NotifyOption').then(() => {
  console.log('通知选项保存成功');
}, () => {
  console.log('通知选项保存失败');
});
