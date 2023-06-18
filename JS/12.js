// 导入所需的模块
const axios = require('axios');
const crypto = require('crypto');

// 设置相关参数
const phoneOrEmail = 'your_phone_or_email';
const password = 'your_password';
const steps = 10000;

// 登录验证
async function login() {
  const loginUrl = 'https://account.xiaomi.com/pass/serviceLoginAuth2';
  const sSecurity = 'pre=';
  const loginData = {
    sid: 'mibi',
    qs: '%3Fsid%3Dmibi',
    _json: 'true',
    callback: 'https://account.xiaomi.com',
    sid: 'mibi',
    hidden: '',
    _sign: '',
    serviceParam: '{"checkSafePhone":false}',
    service: 'mibi',
    buttonText: '',
    user: phoneOrEmail,
    hash: crypto
      .createHash('md5')
      .update(password)
      .digest('hex')
  };

  const response = await axios.post(loginUrl, loginData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  const loginToken = response.headers['set-cookie'][0].split(';')[0];
  const userId = response.data.userId;

  return { loginToken, userId };
}

// 获取App Token
async function getAppToken(loginToken) {
  const appTokenUrl = 'https://api-user.huami.com/registrations/+86' + phoneOrEmail + '/tokens';
  const appTokenData = {
    third_name: 'huami_phone',
    password: password,
    captcha: '',
    redirect_uri: 'https://s3-us-west-2.amazonaws.com/hm-registration/successsignin.html',
    client_id: 'HuaMi',
    grant_type: 'password',
    token: loginToken
  };

  const response = await axios.post(appTokenUrl, appTokenData);
  const appToken = response.data.token_info.app_token;

  return appToken;
}

// 提交模拟的步数数据
async function submitSteps(appToken) {
  const submitUrl = 'https://api-mifit-cn.huami.com/v1/data/band_data.json';
  const submitData = {
    step: steps,
    type: 1,
    source: 2,
    deviceId: 0,
    app_token: appToken
  };

  const response = await axios.post(submitUrl, submitData);

  return response.data;
}

// 执行主要逻辑
async function main() {
  const { loginToken, userId } = await login();
  const appToken = await getAppToken(loginToken);
  const submissionResult = await submitSteps(appToken);

  console.log('步数提交结果:', submissionResult);
}

// 运行主函数
main();
