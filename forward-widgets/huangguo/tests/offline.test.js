"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "huangguo.js"), "utf8");

function loadModule(options = {}) {
  const storage = new Map();
  const calls = { gets: [], posts: [] };
  const widget = {
    storage: {
      async get(key) { return storage.get(key); },
      async set(key, value) { storage.set(key, value); },
    },
    http: {
      async get(url, requestOptions) {
        calls.gets.push({ url, requestOptions });
        return options.get ? options.get(url) : { statusCode: 200, data: "" };
      },
      async post(url, body, requestOptions) {
        calls.posts.push({ url, body, requestOptions });
        return options.post ? options.post(url) : { statusCode: 500, data: "{}" };
      },
    },
  };
  const context = { Widget: widget, module: { exports: {} }, console: { warn() {}, log() {} } };
  vm.runInNewContext(source, context, { timeout: 1000 });
  return { api: context.module.exports, metadata: context.WidgetMetadata, calls };
}

const cardsHtml = [
  '<div class="hg-card-grid is-active" data-channel="latest">',
  '<div class="hg-drama-card"><a class="hg-drama-card__cover-link" href="/video/123/"><img data-src="/cover/123.jpeg" alt="样例短剧"></a><div class="hg-drama-card__title"><a>样例短剧</a></div><span class="hg-drama-card__episode">更新至 4 集</span><span class="hg-drama-card__score">8.2分</span></div>',
  "</div>",
].join("");

test("元数据保留可用分类并移除站点已下线入口", function () {
  const { metadata } = loadModule();
  const titles = metadata.modules.map((item) => item.title);
  assert.ok(titles.includes("AI短剧"));
  assert.ok(titles.includes("AI漫剧"));
  assert.ok(!titles.includes("AI换脸"));
  assert.ok(!titles.includes("AI魔改"));
  assert.strictEqual(metadata.detailCacheDuration, 0);
});

test("列表解析封面、详情身份与卡片字段", function () {
  const { api } = loadModule();
  const items = api.hgParseCards(cardsHtml, "", "latest");
  assert.strictEqual(items.length, 1);
  assert.strictEqual(items[0].title, "样例短剧");
  assert.strictEqual(items[0].link, "hg://detail/123/?cover=https%3A%2F%2Fhuangguoai.com%2Fcover%2F123.jpeg");
  assert.strictEqual(items[0].description, "更新至 4 集");
});

test("已下线分类的 410 响应不再误解析推荐卡片", async function () {
  const { api, calls } = loadModule({
    get: async () => ({ statusCode: 410, data: cardsHtml }),
  });
  const items = await api.loadAiDuanju({ page: 1 });
  assert.strictEqual(items.length, 0);
  assert.match(calls.gets[0].url, /ai-duanju/);
});

test("详情页从 videoInitialData 提取集数并延迟取流", async function () {
  const detailData = {
    title: "测试短剧",
    description: "简介",
    time: "2026-11-15 10:00:00",
    posterSrc: "https://pic.example/cover.jpeg",
    trackingEpisodes: {
      1: { drama_duration: 120, video_id: "15439" },
      2: { drama_duration: 130, video_id: "16715" },
    },
  };
  const html = '<meta property="og:title" content="测试短剧 - 黄果短剧"><script id="videoInitialData" type="application/json">' + JSON.stringify(detailData) + "</script>";
  const { api, calls } = loadModule({ get: async () => ({ statusCode: 200, data: html }) });
  const detail = await api.loadDetail("hg://detail/123/");
  assert.strictEqual(detail.title, "测试短剧");
  assert.deepStrictEqual(Array.from(detail.episodeItems, (item) => item.episodeNumber), [1, 2]);
  assert.strictEqual(calls.gets.length, 1, "详情加载不得预取每集的签名播放地址");
});

test("播放时按剧集调用站点播放 API 并带 CDN 请求头", async function () {
  const response = {
    statusCode: 200,
    data: {
      status: 1,
      data: {
        id: "123",
        ep: 2,
        manifest_method: "GET",
        streams: { main: "https://cdn.example/stream.m3u8?sig=temporary" },
        cdn: { m3u8Enabled: true, otherEnabled: true, authKey: "x-cdn-auth", authValue: "temporary-auth", app: "150" },
      },
    },
  };
  const { api, calls } = loadModule({ post: async () => response });
  const resources = await api.loadResource({ link: "hg://detail/123/?ep=2", episodeNumber: 2 });
  assert.strictEqual(resources.length, 1);
  assert.strictEqual(resources[0].url, "https://cdn.example/stream.m3u8?sig=temporary");
  assert.deepStrictEqual({ ...resources[0].customHeaders }, { "x-cdn-auth": "temporary-auth", "x-cdn-app": "150" });
  assert.match(calls.posts[0].url, /\/api\/videos\/123\/episodes\/2\/playback$/);
  assert.strictEqual(calls.posts[0].body, "{}");
  assert.strictEqual(calls.posts[0].requestOptions.timeout, 20000);
});

test("分片不要求认证头时不向资源或第三方分片域发送 CDN 认证", async function () {
  const { api } = loadModule({
    post: async () => ({
      statusCode: 200,
      data: {
        status: 1,
        data: {
          id: "123",
          ep: 1,
          manifest_method: "GET",
          streams: { main: "https://cdn.example/stream.m3u8?sig=temporary" },
          cdn: { m3u8Enabled: true, otherEnabled: false, authKey: "x-cdn-auth", authValue: "temporary-auth", app: "150" },
        },
      },
    }),
  });
  const resources = await api.loadResource({ link: "hg://detail/123/?ep=1", episodeNumber: 1 });
  assert.strictEqual(resources.length, 1);
  assert.strictEqual(resources[0].customHeaders, undefined);
});

test("播放 API 返回其他剧集时拒绝错误地址", async function () {
  const { api } = loadModule({
    post: async () => ({
      statusCode: 200,
      data: {
        status: 1,
        data: {
          id: "456",
          ep: 2,
          manifest_method: "GET",
          streams: { main: "https://cdn.example/other.m3u8" },
        },
      },
    }),
  });
  const resources = await api.loadResource({ link: "hg://detail/123/?ep=2", episodeNumber: 2 });
  assert.strictEqual(resources.length, 0);
});
