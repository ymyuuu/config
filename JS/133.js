const fetch = require('node-fetch');

// 定义常用的请求头信息
const headers = {
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.182 Safari/537.36',
};

// 获取代码的函数
async function getCode(location) {
  const response = await fetch(location, {
    method: 'GET',
    headers,
  });
  const data = await response.text();
  return data;
}

// 登录函数，获取登录令牌和用户ID
async function login(user, password) {
  const loginUrl = 'http://bs.svv.ink/index.php'; // 替换为实际的登录URL
  const body = {
    user,
    password,
  };

  const response = await fetch(loginUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data = await response.json();
  const { loginToken, userId } = data;
  return { loginToken, userId };
}

// 获取当前时间
function getTime() {
  return Math.floor(Date.now() / 1000);
}

// 获取应用程序令牌
async function getAppToken(loginToken) {
  const appTokenUrl = 'http://bs.svv.ink/index.php'; // 替换为实际的获取应用程序令牌的URL
  const body = {
    loginToken,
  };

  const response = await fetch(appTokenUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data = await response.json();
  const appToken = data.appToken;
  return appToken;
}

// 更改步数函数
async function changeStep(userName, password, step) {
  const { loginToken, userId } = await login(userName, password);
  const appToken = await getAppToken(loginToken);

  const changeStepUrl = `http://bs.svv.ink/index.php/user/${userId}/step`; // 替换为实际的更改步数的URL
  const body = {
    userId,
    step,
    timestamp: getTime(),
    appToken,
  };

  const response = await fetch(changeStepUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return data;
}

// 主程序
async function main() {
  const userName = '15033296069'; // 替换为实际的用户名
  const password = '20030101h'; // 替换为实际的密码
  const step = 80000; // 替换为实际的步数

  try {
    const result = await changeStep(userName, password, step);
    console.log('步数更改成功：', result);
  } catch (error) {
    console.error('步数更改失败：', error);
  }
}

// 运行主程序
main();
