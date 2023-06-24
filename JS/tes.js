const url = decodeURIComponent($request.url);
const x = $request.x;
const y = $request.y;

const keywordsToExclude = x ? x.split('+') : [];
const keywordsToInclude = y ? y.split('+') : [];

if (shouldExcludeScript(url, keywordsToExclude)) {
  // 添加注释符号#来排除脚本
  $done({ response: { body: `#${url}` } });
} else if (shouldIncludeScript(url, keywordsToInclude)) {
  // 去除注释符号#来保留脚本
  $done({ response: { body: url.replace(/^#/, '') } });
} else {
  $done({});
}

function shouldExcludeScript(url, keywordsToExclude) {
  for (const keyword of keywordsToExclude) {
    if (url.includes(keyword)) {
      return true;
    }
  }
  return false;
}

function shouldIncludeScript(url, keywordsToInclude) {
  for (const keyword of keywordsToInclude) {
    if (url.includes(keyword)) {
      return true;
    }
  }
  return false;
}
