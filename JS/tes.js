const url = decodeURIComponent($request.url);

const x = $request.x;
const y = $request.y;

const keywordsToExclude = x ? x.split('+') : [];
const keywordsToInclude = y ? y.split('+') : [];

if (shouldExcludeScript(url, keywordsToExclude)) {
  $done({ response: { body: JSON.stringify({ disabled: true }) } });
} else if (shouldIncludeScript(url, keywordsToInclude)) {
  $done({ response: { body: JSON.stringify({ disabled: false }) } });
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
