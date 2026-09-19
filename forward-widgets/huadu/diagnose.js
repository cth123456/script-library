/*
 * 花都影视 · REX 网络自检（诊断用小模块，不属于正式功能）
 *
 * 用途：在主模块「导入成功但执行失败」时，用它区分是
 *   (a) REX 设备根本连不上站点（DNS/被墙/代理），还是
 *   (b) 主模块脚本本身的问题。
 *
 * 导入地址（RAW）：
 *   https://raw.githubusercontent.com/cth123456/script-library/main/forward-widgets/huadu/diagnose.js
 * 备用镜像：
 *   https://cdn.jsdelivr.net/gh/cth123456/script-library@main/forward-widgets/huadu/diagnose.js
 *
 * 打开后只有一个模块「运行自检」，点一下会逐个访问发布页 / 线路域 / 图片 CDN，
 * 把 HTTP 状态、响应长度、是否命中预期内容直接显示成条目。
 */

WidgetMetadata = {
  id: "forward.huadu.diagnose",
  title: "花都影视 · 网络自检",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "诊断用模块：检查当前设备能否访问花都影视的发布页、线路域与图片 CDN。",
  author: "Codex",
  site: "https://ab.hdfby.com",
  icon: "https://ab.hdfby.com/favicon.ico",
  modules: [
    {
      title: "运行自检",
      description: "逐个请求发布页 / 线路域 / 图片 CDN，显示结果",
      requiresWebView: false,
      functionName: "runCheck",
      cacheDuration: 0,
      params: [],
    },
  ],
};

var CHECK_HEADERS = {
  Accept: "application/json, text/html;q=0.9, */*;q=0.8",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
};

var CHECK_TARGETS = [
  { name: "发布页 ab.hdfby.com", url: "https://ab.hdfby.com/js/config.js", mark: "line_" },
  { name: "发布页 bb.hdfby.com", url: "https://bb.hdfby.com/js/config.js", mark: "line_" },
  { name: "线路 f7.hdys00.com", url: "https://f7.hdys00.com/index.php/ajax/data?mid=1&tid=1&limit=10&page=1", mark: "vod_id" },
  { name: "线路 f7.hdys01.com", url: "https://f7.hdys01.com/index.php/ajax/data?mid=1&tid=1&limit=10&page=1", mark: "vod_id" },
  { name: "线路 f7.huadudm.com", url: "https://f7.huadudm.com/index.php/ajax/data?mid=1&tid=1&limit=10&page=1", mark: "vod_id" },
  { name: "线路 f7.huaduys.com", url: "https://f7.huaduys.com/index.php/ajax/data?mid=1&tid=1&limit=10&page=1", mark: "vod_id" },
  { name: "图片 CDN pic.3010.top", url: "https://pic.3010.top/no.jpg", mark: "" },
];

async function runCheck() {
  var items = [];
  for (var i = 0; i < CHECK_TARGETS.length; i++) {
    var target = CHECK_TARGETS[i];
    var title = "";
    var description = "";
    var ok = false;
    try {
      var response = await Widget.http.get(target.url, { headers: CHECK_HEADERS });
      var status = response && response.statusCode !== undefined ? response.statusCode : 200;
      var body = response && response.data !== undefined && response.data !== null ? String(response.data) : "";
      var hit = target.mark ? body.indexOf(target.mark) >= 0 : body.length > 0;
      ok = status === 200 && hit;
      title = (ok ? "✅ " : "⚠️ ") + target.name + "（HTTP " + status + "）";
      description = "响应 " + body.length + " 字节；" + (hit ? "内容符合预期" : "内容不符合预期（mark=" + target.mark + "）");
    } catch (error) {
      title = "❌ " + target.name;
      description = "请求异常：" + (error && error.message ? error.message : String(error));
    }
    items.push({
      id: "huadu-diag:" + i,
      type: "url",
      mediaType: "movie",
      title: title,
      description: description,
    });
  }
  return items;
}

/* ============================ 可选导出（仅离线测试用） ============================ */

// 宿主里没有 module，这段不会执行；离线夹具用它按名字取用自检函数。
if (typeof module !== "undefined" && module && module.exports) {
  try {
    module.exports = { runCheck: runCheck, CHECK_TARGETS: CHECK_TARGETS };
  } catch (error) {
    // 忽略
  }
}
