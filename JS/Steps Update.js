// 判断账号密码最大步数最小步数是否存在
if (!account) {
console.error('缺少账号信息');
if (notify) {
Extra close brace or missing open brace
done();
}
if (!password) {
console.error('缺少密码信息');
if (notify) {
Extra close brace or missing open brace
done();
}
if (!maxSteps) {
console.error('缺少最大步数信息');
if (notify) {
Extra close brace or missing open brace
done();
}
if (!minSteps) {
console.error('缺少最小步数信息');
if (notify) {
Extra close brace or missing open brace
done();
}

// 判断最大步数和最小步数是否超限
if (maxSteps > 98000 || minSteps > 98000) {
console.log('最大步数和最小步数不能超过98000');
if (notify) {
Extra close brace or missing open brace
done();
} else if (maxSteps < minSteps) {
console.log('最大步数不能小于最小步数');
if (notify) {
Extra close brace or missing open brace
done();
} else if (minSteps > maxSteps) {
console.log('最小步数不能大于最大步数');
if (notify) {
Extra close brace or missing open brace
done();
} else {
const randomSteps = Math.floor(Math.random() * (maxSteps - minSteps + 1)) + minSteps;

const url = 'http://bs.svv.ink/index.php';

const request = {
url: url,
method: 'POST',
headers: {
'Content-Type': 'application/x-www-form-urlencoded',
'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
},
body: account=${account}&password=${password}&steps=${randomSteps}&max_steps=${maxSteps}&min_steps=${minSteps},
};

$httpClient.post(request, function (error, response, data) {
if (error) {
console.error('请求失败：', error);
if (notify) {
Extra close brace or missing open brace
done();
} else if (response.status === 200) {
const jsonData = JSON.parse(data);
console.log(Steps Update Successful: ${randomSteps.toString()}, jsonData);
if (notify) {
$notification.post('Steps Update Successful', Steps: ${randomSteps.toString()}, '@YangMingyu', 'https://t.me/ymyuuu');
}
$done();
} else {
console.error('步数更改失败：', response.status);
if (notify) {
$notification.post('步数更改失败', 失败 状态码：${response.status});
}
if (notify) {
$done();
}
}
});

const newData = ${account},${password},${maxSteps},${minSteps},${notify ? 'M' : 'N'};
$persistentStore.write(newData, 'YangMingyu').then(() => {
console.log('写入成功');
}, () => {
console.log('写入失败');
});
}
