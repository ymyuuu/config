const url = decodeURIComponent($request.url);
const x = $request.x;
const y = $request.y;

const keywordsToExclude = x ? x.split('+') : [];
const keywordsToInclude = y ? y.split('+') : [];

if (shouldExcludeScript(url, keywordsToExclude)) {
  const pluginConfig = {
    disabled: true
  };
  $done({ response: { body: JSON.stringify(pluginConfig) } });
} else if (shouldIncludeScript(url, keywordsToInclude)) {
  const pluginConfig = {
    disabled: false
  };
  $done({ response: { body: JSON.stringify(pluginConfig) } });
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
