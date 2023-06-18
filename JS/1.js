//设置POST请求参数
const postData = {
  account: '15033296069',
  password: '20030101h',
  steps: '88000'
};

//设置fetch请求参数
const requestOptions = {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(postData)
};

//发送POST请求
fetch('http://bs.svv.ink/index.php', requestOptions)
  .then(response => console.log(response))
  .catch(error => console.log('错误信息：', error));
