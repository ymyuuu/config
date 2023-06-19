const account = '15033296069'; // 替换为实际的账号
const password = '20030101h'; // 替换为实际的密码
const steps = '90000'; // 替换为实际的步数


const url = 'http://bs.svv.ink/index.php'; // 替换为实际的 URL

const request = {
  url: url,
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
  },
  body: `account=${account}&password=${password}&steps=${steps}`,
};

$task.fetch(request).then(response => {
  if (response.statusCode === 200) {
    const data = JSON.parse(response.body);
    console.log('步数更改成功：', data);
    $done();
  } else {
    console.error('步数更改失败：', response.statusCode);
    $done();
  }
}).catch(error => {
  console.error('请求失败：', error);
  $done();
});
