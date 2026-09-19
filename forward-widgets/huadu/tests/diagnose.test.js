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

  await check("异常 / 403 / 时好时坏 分别标记 ❌ / ❌ / ⚠️，且不抛错", async function () {
    let hdys01Attempts = 0;
    const loaded = loadDiagnose(async function (url) {
      if (url.indexOf("hdys00") >= 0) throw new Error("网络请求失败：连接超时");
      if (url.indexOf("hdys01") >= 0) {
        hdys01Attempts++;
        if (hdys01Attempts === 1) throw new Error("网络请求失败：TLS 握手失败");
        return { statusCode: 200, data: '{"code":1,"list":[{"vod_id":1}]}' };
      }
      if (url.indexOf("huadudm.com") >= 0) return { statusCode: 403, data: "<html>challenge</html>" };
      if (url.indexOf("/js/config.js") >= 0) return { statusCode: 200, data: 'window.line_1 = "https://x";' };
      if (url.indexOf("/ajax/data") >= 0) return { statusCode: 200, data: '{"code":1,"list":[{"vod_id":1}]}' };
      return { statusCode: 200, data: "binary" };
    });
    const items = await loaded.api.runCheck();
    assert.strictEqual(items.length, 9);
    const hdys00 = items.filter((i) => i.title.indexOf("hdys00") >= 0)[0];
    const hdys01 = items.filter((i) => i.title.indexOf("hdys01") >= 0)[0];
    const hdys02 = items.filter((i) => i.title.indexOf("huadudm.com") >= 0)[0];
    assert.ok(hdys00.title.indexOf("❌") === 0, hdys00.title);
    assert.ok(hdys00.description.indexOf("连接超时") >= 0, hdys00.description);
    assert.ok(hdys01.title.indexOf("⚠️") === 0, "第 1 次失败、后 2 次成功应判为不稳定：" + hdys01.title);
    assert.ok(hdys01Attempts === 3, "应重试 3 次，实际 " + hdys01Attempts);
    assert.ok(hdys02.title.indexOf("❌") === 0, "持续 403 应判为失败：" + hdys02.title);
  });

  out("\n" + (failed ? "存在失败用例" : "全部通过"));
  if (failed) process.exitCode = 1;
}

main();
