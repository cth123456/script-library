/*
 * 网络自检模块（diagnose.js）的离线测试：验证它能把成功/失败渲染成条目
 * 运行：node tests/diagnose.test.js
 */

"use strict";

const assert = require("assert");

const out = console.log.bind(console);
global.console = { log: function () {}, error: out, warn: out };

// 加载自检模块：注入全局 Widget 后 require（用文件自带的可选导出取函数）
function loadDiagnose(httpGet) {
  delete require.cache[require.resolve("../diagnose.js")];
  global.Widget = { http: { get: httpGet } };
  const api = require("../diagnose.js");
  return { metadata: global.WidgetMetadata, api: api };
}

async function main() {
  let failed = 0;
  async function check(name, fn) {
    try {
      await fn();
      out("  ✓ " + name);
    } catch (error) {
      failed++;
      out("  ✗ " + name + "\n      " + (error && error.message ? error.message : error));
    }
  }

  await check("元数据：只声明一个自检模块且函数存在", async function () {
    const loaded = loadDiagnose(async function () {
      return { statusCode: 200, data: "line_1" };
    });
    assert.strictEqual(loaded.metadata.modules.length, 1);
    assert.strictEqual(typeof loaded.api[loaded.metadata.modules[0].functionName], "function");
  });

  await check("全部可达：9 条条目全部标记成功", async function () {
    const loaded = loadDiagnose(async function (url) {
      if (url.indexOf("/js/config.js") >= 0) return { statusCode: 200, data: 'window.line_1 = "https://x";' };
      if (url.indexOf("/ajax/data") >= 0) return { statusCode: 200, data: '{"code":1,"list":[{"vod_id":1}]}' };
      return { statusCode: 200, data: "binary" };
    });
    const items = await loaded.api.runCheck();
    assert.strictEqual(items.length, 9);
    for (const item of items) {
      assert.ok(item.title.indexOf("✅") === 0, "应全部成功：" + item.title);
    }
  });

  await check("被拦截：403 与异常分别标记 ⚠️ / ❌ 且不抛错", async function () {
    const loaded = loadDiagnose(async function (url) {
      if (url.indexOf("hdys00") >= 0) throw new Error("网络请求失败：连接超时");
      if (url.indexOf("hdys01") >= 0) return { statusCode: 403, data: "<html>challenge</html>" };
      if (url.indexOf("/js/config.js") >= 0) return { statusCode: 200, data: 'window.line_1 = "https://x";' };
      if (url.indexOf("/ajax/data") >= 0) return { statusCode: 200, data: '{"code":1,"list":[{"vod_id":1}]}' };
      return { statusCode: 200, data: "binary" };
    });
    const items = await loaded.api.runCheck();
    assert.strictEqual(items.length, 9);
    const hdys00 = items.filter((i) => i.title.indexOf("hdys00") >= 0)[0];
    const hdys01 = items.filter((i) => i.title.indexOf("hdys01") >= 0)[0];
    assert.ok(hdys00.title.indexOf("❌") === 0, hdys00.title);
    assert.ok(hdys00.description.indexOf("连接超时") >= 0, hdys00.description);
    assert.ok(hdys01.title.indexOf("⚠️") === 0, hdys01.title);
  });

  out("\n" + (failed ? "存在失败用例" : "全部通过"));
  if (failed) process.exitCode = 1;
}

main();
