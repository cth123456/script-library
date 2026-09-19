/*
 * 花都影视模块离线夹具测试（纯离线，不访问任何网络）
 *
 * 运行：node tests/offline.test.js
 *
 * 说明：huadu.js 是宿主脚本（顶层赋值 WidgetMetadata、使用全局 Widget），
 * 在 Node 里直接 require 即可执行；每次加载前清 require 缓存以获得干净的模块状态。
 * 所有夹具都是自建合成内容，只保留实测确认过的结构特征，不包含站点真实数据。
 */

"use strict";

const assert = require("assert");
const harness = require("./harness");

const MODULE_SOURCE = harness.MODULE_SOURCE;
const createWidget = harness.createWidget;
const loadModule = harness.loadModule;

// 模块内的 console.log 属于宿主诊断信息，测试期间静默，只保留测试结论输出
const out = console.log.bind(console);
global.console = { log: function () {}, error: out, warn: out };

const HOST_A = "https://f7.hdys00.com";
const HOST_B = "https://f7.hdys01.com";

/* ------------------------- 夹具 ------------------------- */

const CONFIG_JS = [
  "// fixture publish list",
  'window.line_1 = "' + HOST_A + '";',
  'window.line_2 = "' + HOST_B + '";',
  'window.line_3 = "http://f7.hdys02.com";', // http -> 必须被拒
  'window.line_4 = "https://evil.example.com";', // 非白名单 -> 必须被拒
  'window.line_5 = "' + HOST_A + '";', // 重复 -> 去重
  'window.line_6 = "https://bb.hdfby.com/index.html";', // 发布页 -> 不作为 API 入口
  "",
].join("\n");

function listJson(page, ids) {
  const items = ids.map((id, index) => ({
    vod_id: id,
    type_id: 8,
    type_id_1: 1,
    vod_name: "MKMP-7" + String(id).slice(-2) + " 测试条目" + index + "-女演员",
    vod_sub: "テスト映像 " + id,
    vod_en: "MKMP-7" + String(id).slice(-2),
    vod_tag: "标签一, 标签二",
    vod_class: "中字无码",
    vod_pic: "https://pic.3010.top/upload/vod/20260918-1/" + id + ".jpg",
    vod_actor: "演员" + index,
    vod_duration: "03:03:21",
    vod_time: "2026-09-18 19:07:48",
    vod_year: 2026,
    vod_score: 0,
    vod_hits: 6685,
    vod_serial: 0,
    type: { type_id: 8, type_name: "中字无码" },
    type_1: { type_id: 1, type_name: "中文字幕" },
    detail_link: "/index.php/voddetail/" + id + ".html",
  }));
  return JSON.stringify({
    code: 1,
    msg: "数据列表",
    page: page,
    pagecount: 1780,
    limit: 20,
    total: 35560,
    list: items,
  });
}

const SEARCH_HTML = [
  "<!DOCTYPE html><html><head><title>MKMP的搜索结果</title></head><body>",
  // 真实页面写作「相关的&nbsp;<strong>N</strong>」，这里保持同样的实体写法
  '<div class="stui-pannel__head"><h3 class="title">查找到与“<font color="#FF0000">MKMP</font>”相关的&nbsp;<strong style="color:#FF0000;">2</strong>&nbsp;个结果</h3></div>',
  '<ul class="stui-vodlist clearfix">',
  '<li><a class="stui-vodlist__thumb picture w-thumb img-shadow" href="/voddetail/27916.html" title="MKMP-716 搜索命中一" style="border-radius: 10px;">',
  '<img class="lazyload" data-original="https://pic.3010.top/upload/vod/a.jpg" src="/hdys/img/load.gif"><span class="pic-text text-right">03:03:21</span></a></li>',
  '<li><a class="stui-vodlist__thumb picture w-thumb img-shadow" href="/index.php/voddetail/27905.html" title="SORA-643 搜索命中二">',
  '<img class="lazyload" data-original="https://pic.3010.top/upload/vod/b.jpg" src="/hdys/img/load.gif"></a></li>',
  "</ul></body></html>",
].join("\n");

function suggestJson(ids) {
  return JSON.stringify({
    code: 1,
    msg: "数据列表",
    page: 1,
    pagecount: 2,
    limit: 30,
    total: ids.length,
    list: ids.map((id) => ({
      id: id,
      name: "MKMP-7" + String(id).slice(-2) + " recommend",
      en: "MKMP-7" + String(id).slice(-2),
      pic: "https://pic.3010.top/upload/vod/" + id + ".jpg",
    })),
    url: "/index.php/vodsearch/ffcms_wd-------------.html",
  });
}

const DETAIL_HTML = [
  "<!DOCTYPE html><html><head><title>《MKMP-716 详情标题-女演员》详情介绍-中字无码-中文字幕-花都影视-花都资源</title></head><body>",
  '<div class="stui-content__detail">',
  '<img class="lazyload img-shadow" alt="MKMP-716" data-original="https://pic.3010.top/upload/vod/20260821-1/aaa.jpg" src="/hdys/img/load.gif">',
  '<p><strong style="color:#000;">分类：</strong><a href="/vodshow/8-----------.html">中字无码</a></p>',
  '<p><strong style="color:#000;">日期：</strong>2026-09-18</p>',
  '<p><strong style="color:#000;">时长：</strong>03:03:21</p>',
  '<p><strong style="color:#000;">演员：</strong>演员甲</p>',
  '<p><a href="/vodsearch/%E5%8F%A3%E4%BA%A4-------------.html" target="_blank">口交</a>',
  '<a href="/vodsearch/%E5%B7%A8%E4%B9%B3-------------.html" target="_blank">巨乳</a></p>',
  '<h5><a class="btn btn-primary" href="/index.php/vodplay/27916-1-1.html">点击播放</a></h5>',
  "</div>",
  '<h3>猜你喜欢</h3><ul class="stui-vodlist clearfix">',
  '<li><a class="stui-vodlist__thumb picture w-thumb" href="/index.php/voddetail/13470.html" title="相关条目一"><img class="lazyload" data-original="https://pic.3010.top/upload/vod/r1.jpg"></a></li>',
  '<li><a class="stui-vodlist__thumb picture w-thumb" href="/index.php/voddetail/11972.html" title="相关条目二"><img class="lazyload" data-original="https://pic.3010.top/upload/vod/r2.jpg"></a></li>',
  "</ul></body></html>",
].join("\n");

// base64(percentEncode(m3u8))
const M3U8 = "https://cdn.example-cdn.invalid/videos/2026/09/18/abc/def/index.m3u8";
const PLAYER_URL = Buffer.from(encodeURIComponent(M3U8), "utf8").toString("base64");
const PLAY_HTML = [
  "<!DOCTYPE html><html><head><title>正在播放</title></head><body>",
  '<script>var player_data={"flag":"play","encrypt":2,"trysee":0,"points":0,"link":"\\/vodplay\\/27916-1-1.html","link_next":"","link_pre":"","url":"' +
    PLAYER_URL +
    '","url_next":"","from":"hdys","server":"","note":"","sid":1,"nid":1}</script>',
  "</body></html>",
].join("\n");

// 缺失 id：HTTP 200 + 约 1 KB 的占位页
const PLACEHOLDER_HTML =
  '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>系统提示......</title></head><body><div class="notice">系统提示......</div></body></html>';

/* ------------------------- 测试运行器 ------------------------- */

const results = [];
function test(name, fn) {
  results.push({ name: name, fn: fn });
}

async function run() {
  let failed = 0;
  for (const item of results) {
    try {
      await item.fn();
      out("  ✓ " + item.name);
    } catch (error) {
      failed++;
      out("  ✗ " + item.name + "\n      " + (error && error.stack ? error.stack.split("\n")[0] : error));
    }
  }
  out("\n" + (results.length - failed) + "/" + results.length + " 通过");
  if (failed) process.exitCode = 1;
}

/* ------------------------- 测试用例 ------------------------- */

test("源码静态检查：无 eval / Function 构造 / Node 专属 API", function () {
  assert.ok(!/\beval\s*\(/.test(MODULE_SOURCE), "不应出现 eval");
  assert.ok(!/new\s+Function/.test(MODULE_SOURCE), "不应出现 Function 构造");
  assert.ok(!/\brequire\s*\(/.test(MODULE_SOURCE), "不应出现 require");
  assert.ok(!/\bprocess\./.test(MODULE_SOURCE), "不应出现 process");
  assert.ok(!/\bexec\s*\(/.test(MODULE_SOURCE), "不应出现 exec");
  assert.ok(MODULE_SOURCE.indexOf("config.js") >= 0, "应包含发布入口发现");
});

test("元数据：模块函数存在、loadResource 为 stream 且 cacheDuration=0", function () {
  const runtime = createWidget({});
  const loaded = loadModule(runtime.widget);
  const meta = loaded.metadata;
  assert.strictEqual(meta.id, "forward.huadu.vod");
  assert.strictEqual(typeof meta.version, "string");
  const names = meta.modules.map((m) => m.functionName);
  for (const name of names) {
    assert.strictEqual(typeof loaded.api[name], "function", name + " 应是顶层函数");
  }
  const stream = meta.modules.filter((m) => m.id === "loadResource")[0];
  assert.strictEqual(stream.type, "stream");
  assert.strictEqual(stream.cacheDuration, 0);
  assert.strictEqual(typeof meta.search.functionName, "string");
  assert.strictEqual(typeof loaded.api[meta.search.functionName], "function");
});

test("URL 安全：拒绝 http / IP / localhost / 凭据 / 非白名单域", function () {
  const runtime = createWidget({});
  const api = loadModule(runtime.widget).api;
  const rejected = [
    "http://f7.hdys00.com/index.php",
    "https://localhost/index.php",
    "https://127.0.0.1/index.php",
    "https://10.0.0.5/index.php",
    "https://192.168.1.1/index.php",
    "https://user:pass@f7.hdys00.com/index.php",
    "https://[::1]/index.php",
    "https://evil.example.com/index.php",
    "https://f7.hdys00.com.evil.example.com/index.php",
    "https://f7.hdys00.com:8443/index.php",
  ];
  for (const url of rejected) {
    assert.throws(function () {
      api.huaduAssertSafeUrl(url);
    }, /./, "应拒绝：" + url);
  }
  const allowed = [
    "https://f7.hdys00.com/index.php/ajax/data?mid=1",
    "https://ab.hdfby.com/js/config.js",
    "https://f7.huaduys.vip/vodplay/1-1-1.html",
  ];
  for (const url of allowed) {
    assert.strictEqual(api.huaduAssertSafeUrl(url), url);
  }
});

test("config.js 解析：只接受白名单 https，拒绝 http / 外部域，去重", function () {
  const runtime = createWidget({});
  const api = loadModule(runtime.widget).api;
  const entries = api.huaduParseConfigJs(CONFIG_JS);
  assert.strictEqual(entries.join(","), [HOST_A, HOST_B, "https://bb.hdfby.com"].join(","));
  assert.ok(entries.indexOf("http://f7.hdys02.com") < 0, "http 候选必须被拒");
  assert.ok(entries.indexOf("https://evil.example.com") < 0, "非白名单域必须被拒");
});

test("列表：JSON 映射为 VideoItem 字段", async function () {
  const runtime = createWidget({
    routes: {
      "/js/config.js": { statusCode: 200, data: CONFIG_JS },
      "/index.php/ajax/data": { statusCode: 200, data: listJson(1, [27916, 27905]) },
    },
  });
  const api = loadModule(runtime.widget).api;
  const items = await api.loadLatest({ page: 1 });
  assert.strictEqual(items.length, 2);
  const first = items[0];
  assert.strictEqual(first.id, "huadu:27916");
  assert.strictEqual(first.type, "url");
  assert.strictEqual(first.link, "huadu://vod/27916");
  assert.strictEqual(first.title.indexOf("MKMP-716"), 0);
  assert.strictEqual(first.coverUrl, "https://pic.3010.top/upload/vod/20260918-1/27916.jpg");
  assert.strictEqual(first.durationText, "03:03:21");
  assert.strictEqual(first.duration, 3 * 3600 + 3 * 60 + 21);
  assert.strictEqual(first.genreTitle, "中字无码");
  assert.strictEqual(first.mediaType, "movie");
  assert.strictEqual(first.releaseDate, "2026-09-18");
});

test("列表：分页按站点上限裁剪，limit 使用白名单值", async function () {
  const runtime = createWidget({
    routes: {
      "/js/config.js": { statusCode: 200, data: CONFIG_JS },
      "/index.php/ajax/data": { statusCode: 200, data: listJson(1, [1]) },
    },
  });
  const api = loadModule(runtime.widget).api;
  await api.loadLatest({ page: 25 });
  await api.loadLatest({ page: 0 });

  const listCalls = runtime.state.calls.filter((c) => c.url.indexOf("/index.php/ajax/data") >= 0);
  assert.strictEqual(listCalls.length, 2);
  assert.ok(listCalls[0].url.indexOf("page=20") >= 0, "page=25 应裁剪为 20：" + listCalls[0].url);
  assert.ok(listCalls[1].url.indexOf("page=1") >= 0, "page=0 应裁剪为 1：" + listCalls[1].url);
  for (const call of listCalls) {
    assert.ok(/[?&]limit=20(&|$)/.test(call.url), "limit 必须是白名单值：" + call.url);
  }
});

test("分类：params.category 透传为 tid，genreId 优先", async function () {
  const runtime = createWidget({
    routes: {
      "/js/config.js": { statusCode: 200, data: CONFIG_JS },
      "/index.php/ajax/data": { statusCode: 200, data: listJson(1, [7]) },
    },
  });
  const api = loadModule(runtime.widget).api;
  await api.loadCategory({ category: "8", page: 1 });
  await api.loadLatest({ genreId: "16", page: 1 });
  const listCalls = runtime.state.calls.filter((c) => c.url.indexOf("/index.php/ajax/data") >= 0);
  assert.ok(listCalls[0].url.indexOf("tid=8") >= 0, listCalls[0].url);
  assert.ok(listCalls[1].url.indexOf("tid=16") >= 0, listCalls[1].url);
});

test("搜索：关键词走 wd 查询参数（不放进路径段）", async function () {
  const runtime = createWidget({
    routes: {
      "/js/config.js": { statusCode: 200, data: CONFIG_JS },
      "/vodsearch/": { statusCode: 200, data: SEARCH_HTML },
    },
  });
  const api = loadModule(runtime.widget).api;
  const items = await api.search({ keyword: "MKMP", page: 2 });
  assert.strictEqual(items.length, 2);
  assert.strictEqual(items[0].id, "huadu:27916");
  assert.strictEqual(items[1].id, "huadu:27905");
  assert.strictEqual(items[0].coverUrl, "https://pic.3010.top/upload/vod/a.jpg");
  assert.strictEqual(items[0].description, "03:03:21");

  const searchCall = runtime.state.calls.filter((c) => c.url.indexOf("/vodsearch/") >= 0)[0];
  assert.ok(searchCall.url.indexOf("wd=MKMP") >= 0, "关键词应在 wd 参数：" + searchCall.url);
  assert.ok(searchCall.url.indexOf("page=2") >= 0, "应带上页码：" + searchCall.url);
  assert.ok(searchCall.url.indexOf("/vodsearch/MKMP") < 0, "关键词不得出现在路径段：" + searchCall.url);
});

test("搜索降级：搜索页 5xx 时走 suggest，并丢弃已下架死链", async function () {
  let searchAttempts = 0;
  const runtime = createWidget({
    routes: {
      "/js/config.js": { statusCode: 200, data: CONFIG_JS },
      "/index.php/ajax/suggest": { statusCode: 200, data: suggestJson([27916, 29487]) },
      "/index.php/voddetail/27916.html": { statusCode: 200, data: DETAIL_HTML },
      "/index.php/voddetail/29487.html": { statusCode: 200, data: PLACEHOLDER_HTML },
    },
    intercept: function (url) {
      if (url.indexOf("/vodsearch/") >= 0) {
        searchAttempts++;
        return { statusCode: 503, data: "maintenance" };
      }
      return undefined;
    },
  });
  const api = loadModule(runtime.widget).api;
  const items = await api.search({ keyword: "MKMP-751", page: 1 });
  assert.ok(searchAttempts >= 1, "应先尝试搜索页");
  const ids = items.map((i) => i.id);
  assert.ok(ids.indexOf("huadu:27916") >= 0, "存活条目应保留：" + ids.join(","));
  assert.ok(ids.indexOf("huadu:29487") < 0, "已下架条目应被丢弃：" + ids.join(","));
});

test("搜索降级：页面结构变化（无计数标记也无卡片）时改走 suggest", async function () {
  const runtime = createWidget({
    routes: {
      "/js/config.js": { statusCode: 200, data: CONFIG_JS },
      "/vodsearch/": { statusCode: 200, data: "<html><body><div class='empty'>nothing here</div></body></html>" },
      "/index.php/ajax/suggest": { statusCode: 200, data: suggestJson([27916]) },
      "/index.php/voddetail/27916.html": { statusCode: 200, data: DETAIL_HTML },
    },
  });
  const api = loadModule(runtime.widget).api;
  const items = await api.search({ keyword: "MKMP", page: 1 });
  assert.strictEqual(items.length, 1);
  assert.strictEqual(items[0].id, "huadu:27916");
  const suggestUsed = runtime.state.calls.filter((c) => c.url.indexOf("/ajax/suggest") >= 0);
  assert.strictEqual(suggestUsed.length, 1, "结构异常时应走 suggest");
});

test("搜索：真实空结果返回空数组（不是降级、不是报错）", async function () {
  const runtime = createWidget({
    routes: {
      "/js/config.js": { statusCode: 200, data: CONFIG_JS },
      "/vodsearch/": {
        statusCode: 200,
        data:
          '<html><head><title>zzz的搜索结果</title></head><body>查找到与“zzz”相关的&nbsp;<strong>0</strong>&nbsp;个结果' +
          '<ul class="stui-vodlist clearfix"></ul></body></html>',
      },
      "/index.php/ajax/suggest": { statusCode: 200, data: suggestJson([27916]) },
    },
  });
  const api = loadModule(runtime.widget).api;
  const items = await api.search({ keyword: "zzz", page: 1 });
  assert.strictEqual(items.length, 0);
  const suggestUsed = runtime.state.calls.filter((c) => c.url.indexOf("/ajax/suggest") >= 0);
  assert.strictEqual(suggestUsed.length, 0, "真实空结果不应触发降级");
});

test("宿主形态兼容：JSON 已被宿主解析成对象时列表照常工作", async function () {
  // 真机实测：宿主会按 Content-Type 自动解析 JSON，data 不是字符串而是对象
  const runtime = createWidget({
    routes: {
      "/js/config.js": { statusCode: 200, data: CONFIG_JS },
    },
    intercept: function (url) {
      if (url.indexOf("/index.php/ajax/data") >= 0) {
        return { statusCode: 200, data: JSON.parse(listJson(1, [27916])) };
      }
      return undefined;
    },
  });
  const api = loadModule(runtime.widget).api;
  const items = await api.loadLatest({ page: 1 });
  assert.strictEqual(items.length, 1);
  assert.strictEqual(items[0].id, "huadu:27916");
});

test("宿主形态兼容：无包装字段 / status 命名 / body 字段都能识别", async function () {
  const runtime = createWidget({
    routes: {
      "/js/config.js": { statusCode: 200, data: CONFIG_JS },
    },
    intercept: function (url) {
      if (url.indexOf("/index.php/ajax/data") >= 0) {
        // 既无 data 也无状态字段：直接把响应体当负载
        return JSON.parse(listJson(1, [27916, 27905]));
      }
      if (url.indexOf("/index.php/voddetail/27916.html") >= 0) {
        // 用 status 而不是 statusCode，且用 body 承载 HTML
        return { status: 200, body: DETAIL_HTML };
      }
      return undefined;
    },
  });
  const api = loadModule(runtime.widget).api;
  const items = await api.loadLatest({ page: 1 });
  assert.strictEqual(items.length, 2);
  const detail = await api.loadDetail("huadu://vod/27916");
  assert.strictEqual(detail.title, "MKMP-716 详情标题-女演员");
});

test("全部线路都在冷却时：忽略冷却强制重试一轮（不卡死）", async function () {
  const runtime = createWidget({
    routes: {
      "/js/config.js": { statusCode: 200, data: CONFIG_JS },
    },
    intercept: function (url) {
      if (url.indexOf("/index.php/ajax/data") >= 0) {
        return { statusCode: 500, data: "boom" };
      }
      return undefined;
    },
  });
  const api = loadModule(runtime.widget).api;

  let firstFailed = false;
  try {
    await api.loadLatest({ page: 1 });
  } catch (error) {
    firstFailed = true;
  }
  assert.ok(firstFailed, "第一次应失败并让线路进入冷却");

  runtime.state.calls.length = 0;
  let secondFailed = false;
  try {
    // 第二页（不同缓存键）在全部冷却的情况下仍应真的发出请求，而不是直接抛“冷却中”
    await api.loadLatest({ page: 2 });
  } catch (error) {
    secondFailed = true;
  }
  assert.ok(secondFailed, "站点仍故障时应当失败");
  const listCalls = runtime.state.calls.filter((c) => c.url.indexOf("/index.php/ajax/data") >= 0);
  assert.ok(listCalls.length > 0, "冷却期也应有真实请求（强制重试）");
});

test("详情：字段解析 + 猜你喜欢相关条目", async function () {
  const runtime = createWidget({
    routes: {
      "/js/config.js": { statusCode: 200, data: CONFIG_JS },
      "/index.php/voddetail/27916.html": { statusCode: 200, data: DETAIL_HTML },
    },
  });
  const api = loadModule(runtime.widget).api;
  const item = await api.loadDetail("huadu://vod/27916");
  assert.strictEqual(item.id, "huadu:27916");
  assert.strictEqual(item.title, "MKMP-716 详情标题-女演员");
  assert.strictEqual(item.coverUrl, "https://pic.3010.top/upload/vod/20260821-1/aaa.jpg");
  assert.strictEqual(item.detailPoster, item.coverUrl);
  assert.strictEqual(item.releaseDate, "2026-09-18");
  assert.strictEqual(item.durationText, "03:03:21");
  assert.strictEqual(item.genreTitle, "中字无码");
  assert.ok(item.description.indexOf("口交") >= 0, "标签应进入 description：" + item.description);
  assert.ok(item.description.indexOf("演员甲") >= 0, "演员应进入 description：" + item.description);
  assert.strictEqual(item.relatedItems.length, 2);
  assert.strictEqual(item.relatedItems[0].id, "huadu:13470");
  assert.strictEqual(item.playPath, "27916-1-1");
});

test("详情：占位页返回 null（不是空数组、不抛异常）", async function () {
  const runtime = createWidget({
    routes: {
      "/js/config.js": { statusCode: 200, data: CONFIG_JS },
      "/index.php/voddetail/999999999.html": { statusCode: 200, data: PLACEHOLDER_HTML },
    },
  });
  const api = loadModule(runtime.widget).api;
  const item = await api.loadDetail("huadu://vod/999999999");
  assert.strictEqual(item, null);
});

test("播放：player_data.url 两步解码为 m3u8", async function () {
  const runtime = createWidget({
    routes: {
      "/js/config.js": { statusCode: 200, data: CONFIG_JS },
      "/index.php/vodplay/27916-1-1.html": { statusCode: 200, data: PLAY_HTML },
    },
  });
  const api = loadModule(runtime.widget).api;
  const resources = await api.loadResource({ link: "huadu://vod/27916" });
  assert.strictEqual(resources.length, 1);
  assert.strictEqual(resources[0].url, M3U8);
  assert.strictEqual(typeof resources[0].name, "string");
  const playCall = runtime.state.calls.filter((c) => c.url.indexOf("/vodplay/") >= 0)[0];
  assert.ok(playCall.url.indexOf("27916-1-1.html") >= 0, playCall.url);
});

test("播放：缺失播放页返回空数组（真实不存在，不抛异常）", async function () {
  const runtime = createWidget({
    routes: {
      "/js/config.js": { statusCode: 200, data: CONFIG_JS },
      "/index.php/vodplay/999999999-1-1.html": { statusCode: 200, data: PLACEHOLDER_HTML },
    },
  });
  const api = loadModule(runtime.widget).api;
  const resources = await api.loadResource({ id: "999999999" });
  assert.strictEqual(resources.length, 0);
});

test("瞬时失败：同域立即重试后成功", async function () {
  let firstAttempt = true;
  const runtime = createWidget({
    routes: {
      "/js/config.js": { statusCode: 200, data: CONFIG_JS },
      "/index.php/ajax/data": function () {
        if (firstAttempt) {
          firstAttempt = false;
          return { statusCode: 502, data: "bad gateway" };
        }
        return { statusCode: 200, data: listJson(1, [27916]) };
      },
    },
  });
  const api = loadModule(runtime.widget).api;
  const items = await api.loadLatest({ page: 1 });
  assert.strictEqual(items.length, 1);
  const listCalls = runtime.state.calls.filter((c) => c.url.indexOf("/index.php/ajax/data") >= 0);
  assert.strictEqual(listCalls.length, 2, "应对同域重试一次");
  assert.strictEqual(listCalls[0].url, listCalls[1].url, "重试应打同一个地址");
});

test("403 挑战：重试后成功", async function () {
  let seen = 0;
  const runtime = createWidget({
    routes: {
      "/js/config.js": { statusCode: 200, data: CONFIG_JS },
      "/index.php/ajax/data": function () {
        seen++;
        if (seen === 1) return { statusCode: 403, data: "" };
        return { statusCode: 200, data: listJson(1, [27916]) };
      },
    },
  });
  const api = loadModule(runtime.widget).api;
  const items = await api.loadLatest({ page: 1 });
  assert.strictEqual(items.length, 1);
  assert.strictEqual(seen, 2);
});

test("跨域切换 + lastGood：A 域失败后切 B，下次优先 B", async function () {
  const runtime = createWidget({
    routes: {
      "/js/config.js": { statusCode: 200, data: CONFIG_JS },
      "/index.php/ajax/data": function (url) {
        if (url.indexOf(HOST_A) === 0) return { statusCode: 500, data: "boom" };
        return { statusCode: 200, data: listJson(1, [27916]) };
      },
    },
  });

  const first = loadModule(runtime.widget).api;
  const items = await first.loadLatest({ page: 1 });
  assert.strictEqual(items.length, 1);

  const hostsFirst = runtime.state.calls
    .filter((c) => c.url.indexOf("/index.php/ajax/data") >= 0)
    .map((c) => (c.url.indexOf(HOST_A) === 0 ? "A" : "B"));
  assert.deepStrictEqual(hostsFirst, ["A", "A", "B"], "A 域重试一次后应切到 B：" + hostsFirst.join(","));

  runtime.state.calls.length = 0;
  const second = loadModule(runtime.widget).api;
  await second.loadLatest({ page: 1 });
  const firstDataCall = runtime.state.calls.filter((c) => c.url.indexOf("/index.php/ajax/data") >= 0)[0];
  assert.ok(firstDataCall.url.indexOf(HOST_B) === 0, "第二次应先走 lastGood：" + firstDataCall.url);
});

test("失败域冷却：连续失败后不再尝试该域", async function () {
  const runtime = createWidget({
    routes: {
      "/js/config.js": { statusCode: 200, data: CONFIG_JS },
      "/index.php/ajax/data": function (url) {
        if (url.indexOf(HOST_A) === 0) return { statusCode: 500, data: "boom" };
        return { statusCode: 200, data: listJson(1, [27916]) };
      },
    },
  });

  const api = loadModule(runtime.widget).api;
  await api.loadLatest({ page: 1 });
  runtime.state.calls.length = 0;
  // 第二页走不同缓存键，确保真的有请求发出
  await api.loadLatest({ page: 2 });

  const hosts = runtime.state.calls
    .filter((c) => c.url.indexOf("/index.php/ajax/data") >= 0)
    .map((c) => (c.url.indexOf(HOST_A) === 0 ? "A" : "B"));
  assert.ok(hosts.indexOf("A") < 0, "冷却期不应再请求 A：" + hosts.join(","));
  assert.ok(hosts.indexOf("B") >= 0, "应直接使用 B：" + hosts.join(","));
});

test("候选缓存：发现结果写入存储并在 TTL 内复用", async function () {
  const runtime = createWidget({
    routes: {
      "/js/config.js": { statusCode: 200, data: CONFIG_JS },
      "/index.php/ajax/data": { statusCode: 200, data: listJson(1, [27916]) },
    },
  });
  const api = loadModule(runtime.widget).api;
  await api.loadLatest({ page: 1 });
  const configCalls = runtime.state.calls.filter((c) => c.url.indexOf("/js/config.js") >= 0);
  assert.strictEqual(configCalls.length, 1, "首次应读取发布页");

  runtime.state.calls.length = 0;
  await api.loadLatest({ page: 1 });
  const configCalls2 = runtime.state.calls.filter((c) => c.url.indexOf("/js/config.js") >= 0);
  assert.strictEqual(configCalls2.length, 0, "TTL 内不应重复读取发布页");
  assert.ok(runtime.state.storage["huadu.entries.v1"], "候选清单应写入存储");
});

test("发布页不可用：回退内置候选域", async function () {
  const runtime = createWidget({
    routes: {
      "/index.php/ajax/data": { statusCode: 200, data: listJson(1, [27916]) },
    },
  });
  const api = loadModule(runtime.widget).api;
  const items = await api.loadLatest({ page: 1 });
  assert.strictEqual(items.length, 1);
  const dataCall = runtime.state.calls.filter((c) => c.url.indexOf("/index.php/ajax/data") >= 0)[0];
  assert.ok(dataCall.url.indexOf("://f7.hdys") > 0, "应使用内置候选域：" + dataCall.url);
});

test("存储不可用：模块仍可工作（内存态）", async function () {
  const runtime = createWidget({
    storageBroken: true,
    routes: {
      "/js/config.js": { statusCode: 200, data: CONFIG_JS },
      "/index.php/ajax/data": { statusCode: 200, data: listJson(1, [27916]) },
    },
  });
  const api = loadModule(runtime.widget).api;
  const items = await api.loadLatest({ page: 1 });
  assert.strictEqual(items.length, 1);
});

test("全部线路失败：抛出错误而不是返回空数组", async function () {
  const runtime = createWidget({
    routes: {
      "/js/config.js": { statusCode: 200, data: CONFIG_JS },
    },
    intercept: function (url) {
      if (url.indexOf("/index.php/ajax/data") >= 0) return { statusCode: 500, data: "boom" };
      return undefined;
    },
  });
  const api = loadModule(runtime.widget).api;
  let threw = false;
  try {
    await api.loadLatest({ page: 1 });
  } catch (error) {
    threw = true;
  }
  assert.ok(threw, "硬失败必须抛错，不能静默返回空数组");
});

test("空搜索关键词：直接返回空数组，不发请求", async function () {
  const runtime = createWidget({});
  const api = loadModule(runtime.widget).api;
  const items = await api.search({ keyword: "   " });
  assert.strictEqual(items.length, 0);
  assert.strictEqual(runtime.state.calls.length, 0);
});

test("id 解析：link / 详情 URL / 播放 URL / 纯数字", function () {
  const runtime = createWidget({});
  const api = loadModule(runtime.widget).api;
  assert.strictEqual(api.huaduExtractId("huadu:27916"), "27916");
  assert.strictEqual(api.huaduExtractId("huadu://vod/27916"), "27916");
  assert.strictEqual(api.huaduExtractId("https://f7.hdys00.com/index.php/voddetail/27916.html"), "27916");
  assert.strictEqual(api.huaduExtractId("/vodplay/27916-1-1.html"), "27916");
  assert.strictEqual(api.huaduExtractId("27916"), "27916");
  assert.strictEqual(api.huaduExtractId(""), "");
});

test("播放地址解码：base64 + 百分号编码（含另一层兜底）", function () {
  const runtime = createWidget({});
  const api = loadModule(runtime.widget).api;
  assert.strictEqual(api.huaduDecodePlayerUrl(PLAYER_URL), M3U8);
  assert.strictEqual(api.huaduDecodePlayerUrl(encodeURIComponent(M3U8)), M3U8);
  assert.throws(function () {
    api.huaduDecodePlayerUrl("!!!not-base64!!!");
  });
});

run();
