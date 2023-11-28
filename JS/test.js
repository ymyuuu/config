// 在你的 JavaScript 文件中
function sendTelegramMessage() {
  function callback(ip, location, asn, org) {
    var currentDate = new Date();
    var currentTime = currentDate.toLocaleString();

    var message = `
*${currentTime}*
        
*Info IP:* \`${ip}\`

*Location:* ${location}
*ASN:* ${asn}
*Organization:* ${org}
`;

    var botToken = '5975737743:AAFxFhwL8_VIvZRkqXYeDVngTH3zXaqhy68';
    var chatId = '5957163999';

    var apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

    var data = {
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown'
    };

    fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      .then(response => response.json())
      .then(data => console.log(data))
      .catch(error => console.error('Error:', error));
  }

  // 使用jsonp调用
  var script = document.createElement('script');
  script.src = 'https://ipv4.ping0.cc/geo/jsonp/callback';
  document.body.appendChild(script);
}
