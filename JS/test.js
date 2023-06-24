$loon.plugin("Rewrite_to_Loon", function (plugin) {
  var url = plugin.url;

  // 解析 URL 参数
  var params = getUrlParams(url);

  // 获取 x 参数，排除脚本关键词
  var excludeKeywords = params["x"] ? params["x"].split("+") : [];

  // 获取 y 参数，保留脚本关键词
  var includeKeywords = params["y"] ? params["y"].split("+") : [];

  // 根据关键词进行处理
  if (excludeKeywords.length > 0 || includeKeywords.length > 0) {
    // 获取插件脚本内容
    plugin.loadContent();

    // 根据关键词排除脚本
    if (excludeKeywords.length > 0) {
      var excludeRegex = new RegExp(excludeKeywords.join("|"), "i");
      plugin.content = plugin.content.replace(excludeRegex, function (match) {
        return "#" + match;
      });
    }

    // 根据关键词保留脚本
    if (includeKeywords.length > 0) {
      var includeRegex = new RegExp(includeKeywords.join("|"), "i");
      plugin.content = plugin.content.replace(includeRegex, function (match) {
        return match.replace("#", "");
      });
    }

    // 更新插件脚本内容
    plugin.saveContent();
  }
});

// 解析 URL 参数的函数
function getUrlParams(url) {
  var params = {};
  var paramString = url.split("?")[1];
  if (paramString) {
    var paramPairs = paramString.split("&");
    for (var i = 0; i < paramPairs.length; i++) {
      var pair = paramPairs[i].split("=");
      var key = decodeURIComponent(pair[0]);
      var value = decodeURIComponent(pair[1]);
      params[key] = value;
    }
  }
  return params;
}
