const http = require('http');

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  hostname: 'bs.svv.ink',
  path: '/index.php',
  port: 80
};

const req = http.request(options, res => {
  let chunks = [];
  res.on("data", chunk => chunks.push(chunk));
  res.on("end", () => {
    const resData = Buffer.concat(chunks).toString('utf-8');
    console.log(resData);
  });
});

req.on('error', error => {
  console.error(error);
});

const postData = 'account=' + encodeURIComponent('15033296069') +
  '&password=' + encodeURIComponent('20030101h') +
  '&steps=' + encodeURIComponent('80000');

// 发送请求
req.write(postData);
req.end();
