/*
 * 花都影视模块「现网抽样」脚本（人工执行，默认不参与离线测试）
 *
 * 运行：node tests/live-smoke.test.js
 *
 * 与 offline.test.js 的区别：本脚本真的访问站点，用来确认解析路径在真实响应上成立。
 * 只做低频只读请求（发布页 1 次 + 列表 2 次 + 搜索 1 次 + 详情 1 次 + 播放 1 次），
 * 不打印媒体地址与完整页面内容，只打印字段级摘要。
 */

"use strict";

const harness = require("./harness");

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15";

const calls = [];

// 真实网络适配器：把模块发出的请求交给 Node 的 fetch
function createLiveWidget() {
  return {
    http: {
      async get(url, options) {
        calls.push(url);
        const headers = Object.assign({ "User-Agent": UA }, (options && options.headers) || {});
        const response = await fetch(url, { headers: headers });
        const text = await response.text();
        return { statusCode: response.status, data: text };
      },
    },
    storage: {
      async get() {
        return undefined;
      },
      async set() {
        return true;
      },
      async remove() {
        return true;
      },
    },
  };
}

function hostOf(url) {
  const match = url.match(/^https?:\/\/([^/?#]+)/);
  return match ? match[1] : "?";
}

function pick(item) {
  if (!item) return null;
  return {
    id: item.id,
    title: (item.title || "").slice(0, 26),
    cover: item.coverUrl ? item.coverUrl.slice(0, 30) + "…" : "",
    duration: item.durationText || "",
    genre: item.genreTitle || "",
  };
}

async function main() {
  const api = harness.loadModule(createLiveWidget()).api;

  console.log("== 1. 最新列表（第 1 页）==");
  const latest = await api.loadLatest({ page: 1 });
  console.log("   条数：" + latest.length);
  console.log("   首条：" + JSON.stringify(pick(latest[0])));

  console.log("\n== 2. 分类浏览（tid=8 第 2 页）==");
  const category = await api.loadCategory({ category: "8", page: 2 });
  console.log("   条数：" + category.length);
  console.log("   首条：" + JSON.stringify(pick(category[0])));

  console.log("\n== 3. 搜索（用首条番号）==");
  const code = (latest[0].originalTitle || latest[0].title.split(" ")[0] || "").slice(0, 12);
  const searched = await api.search({ keyword: code, page: 1 });
  console.log("   关键词：" + code + "，条数：" + searched.length);
  console.log("   首条：" + JSON.stringify(pick(searched[0])));

  console.log("\n== 4. 详情 ==");
  const detail = await api.loadDetail(latest[0].link);
  console.log("   标题：" + (detail ? detail.title : "(null)"));
  console.log("   分类：" + (detail ? detail.genreTitle : "-"));
  console.log("   时长：" + (detail ? detail.durationText : "-"));
  console.log("   相关：" + (detail ? detail.relatedItems.length : 0) + " 条");
  console.log("   描述片段：" + (detail && detail.description ? detail.description.slice(0, 40) : "-"));

  console.log("\n== 5. 播放资源 ==");
  const resources = await api.loadResource({ link: latest[0].link });
  console.log("   资源数：" + resources.length);
  if (resources.length) {
    const parsed = resources[0].url.match(/^(https?):\/\/([^/]+)(\/[^?#]*)/);
    console.log("   协议：" + (parsed ? parsed[1] : "?") + "，主机：" + (parsed ? parsed[2] : "?"));
    console.log("   路径符合 /videos/…/index.m3u8：" + /\/index\.m3u8$/.test(parsed ? parsed[3] : ""));
  }

  console.log("\n== 请求主机（去重）==");
  console.log("   " + Array.from(new Set(calls.map(hostOf))).join(", "));
  console.log("   总请求数：" + calls.length);
}

main().catch(function (error) {
  console.error("现网抽样失败：" + (error && error.message ? error.message : error));
  process.exitCode = 1;
});
