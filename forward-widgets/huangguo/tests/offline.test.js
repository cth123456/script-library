"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
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
      async remove(key) { storage.delete(key); },
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
  return { api: context.module.exports, metadata: context.WidgetMetadata, calls, storage };
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
  assert.ok(metadata.modules.filter((item) => item.functionName !== "loadResource").every((item) => item.cacheDuration === 0));
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
  const detailGets = calls.gets.filter((c) => c.url.indexOf("/video/123/") >= 0);
  assert.strictEqual(detailGets.length, 1, "详情加载不得预取每集的签名播放地址");
  assert.strictEqual(detail.coverUrl, "https://pic.example/cover.jpeg", "解密失败时保留原始封面地址");
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
  assert.strictEqual(resources.length, 2);
  assert.strictEqual(resources[0].url, "https://cdn.example/stream.m3u8?sig=temporary");
  assert.strictEqual(resources[0].playerType, "system");
  assert.strictEqual(resources[1].playerType, "app");
  assert.strictEqual(resources[1].url, resources[0].url);
  assert.strictEqual(resources[0].customHeaders["x-cdn-auth"], "temporary-auth");
  assert.strictEqual(resources[0].customHeaders["x-cdn-app"], "150");
  assert.strictEqual(resources[0].customHeaders.Referer, undefined);
  assert.strictEqual(resources[0].customHeaders.Origin, undefined);
  assert.strictEqual(resources[0].customHeaders["User-Agent"], undefined);
  assert.strictEqual(resources[0].playerType, "system");
  assert.match(calls.posts[0].url, /\/api\/videos\/123\/episodes\/2\/playback$/);
  assert.strictEqual(calls.posts[0].body, "{}");
  assert.strictEqual(calls.posts[0].requestOptions.timeout, 10000);
  assert.match(calls.posts[0].requestOptions.headers.Referer, /huangguoai\.com/);
  assert.match(calls.posts[0].requestOptions.headers.Origin, /huangguoai\.com/);
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
  assert.strictEqual(resources.length, 2);
  assert.strictEqual(resources[0].customHeaders, undefined);
  assert.strictEqual(resources[1].customHeaders, undefined);
  assert.strictEqual(resources[0].playerType, "system");
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

test("播放 API 优先使用 main；缺少 main 时回退 hevc / preview", async function () {
  const mainFirst = loadModule({
    post: async () => ({
      statusCode: 200,
      data: {
        status: 1,
        data: {
          id: "123",
          ep: 1,
          manifest_method: "GET",
          streams: {
            main: "https://cdn.example/main.m3u8",
            hevc: "https://cdn.example/hevc.m3u8",
            preview: "https://cdn.example/preview.m3u8",
          },
        },
      },
    }),
  });
  const mainResources = await mainFirst.api.loadResource({ link: "hg://detail/123/?ep=1", episodeNumber: 1 });
  assert.strictEqual(mainResources.length, 2);
  assert.strictEqual(mainResources[0].url, "https://cdn.example/main.m3u8");
  assert.strictEqual(mainResources[1].url, mainResources[0].url);

  const { api } = loadModule({
    post: async () => ({
      statusCode: 200,
      data: {
        status: 1,
        data: {
          id: "123",
          ep: 1,
          manifest_method: "GET",
          streams: { hevc: "https://cdn.example/hevc.m3u8", preview: "https://cdn.example/preview.m3u8" },
        },
      },
    }),
  });
  const resources = await api.loadResource({ link: "hg://detail/123/?ep=1", episodeNumber: 1 });
  assert.strictEqual(resources.length, 4);
  assert.strictEqual(resources[0].url, "https://cdn.example/hevc.m3u8");
  assert.strictEqual(resources[1].playerType, "app");
  assert.strictEqual(resources[2].url, "https://cdn.example/preview.m3u8");
  assert.strictEqual(resources[3].playerType, "app");
});

test("播放接口瞬时失败时自动重试一次", async function () {
  let attempts = 0;
  const { api } = loadModule({
    post: async () => {
      attempts++;
      if (attempts === 1) throw new Error("network reset");
      return {
        statusCode: 200,
        data: {
          status: 1,
          data: {
            id: "123",
            ep: 1,
            manifest_method: "GET",
            streams: { main: "https://cdn.example/retry.m3u8" },
          },
        },
      };
    },
  });
  const resources = await api.loadResource({ link: "hg://detail/123/?ep=1", episodeNumber: 1 });
  assert.strictEqual(attempts, 2);
  assert.strictEqual(resources.length, 2);
  assert.strictEqual(resources[0].url, "https://cdn.example/retry.m3u8");
});

// 站点封面为 AES-128-CBC / NoPadding 密文；用同一公开 key/IV 造夹具。
function encryptCover(payloadBytes) {
  const key = Buffer.from("f5d965df75336270", "utf8");
  const iv = Buffer.from("97b60394abc2fbe1", "utf8");
  const padded = Buffer.alloc(Math.max(16, Math.ceil(payloadBytes.length / 16) * 16));
  payloadBytes.copy(padded);
  const cipher = crypto.createCipheriv("aes-128-cbc", key, iv);
  cipher.setAutoPadding(false);
  return Buffer.concat([cipher.update(padded), cipher.final()]).toString("base64");
}

test("封面解密：AES-128-CBC/NoPadding 还原 JPEG 头", function () {
  const { api } = loadModule();
  const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(60, 0x41)]);
  const cipher = api.hgBase64ToBytes(encryptCover(jpeg));
  const plain = Buffer.from(
    api.hgAesCbcDecrypt(
      cipher,
      Buffer.from("f5d965df75336270", "utf8"),
      Buffer.from("97b60394abc2fbe1", "utf8"),
    ),
  );
  assert.deepStrictEqual(plain.subarray(0, 4), jpeg.subarray(0, 4));
  assert.strictEqual(api.hgBytesToBase64(new Uint8Array([0xff, 0xd8, 0xff])).slice(0, 4), "/9j/");
});

test("列表封面：未配置 Worker 时本地解密为 data URL", async function () {
  const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(80, 0x42)]);
  const base64 = encryptCover(jpeg);
  const { api } = loadModule({
    get: async (url) => {
      if (url.indexOf("/ai-duanju") >= 0) return { statusCode: 200, data: cardsHtml };
      return { statusCode: 200, data: base64 };
    },
  });
  const items = await api.loadAiDuanju({ page: 1 });
  assert.strictEqual(items.length, 1);
  assert.match(items[0].coverUrl, /^data:image\/jpeg;base64,/);
  const decoded = Buffer.from(items[0].coverUrl.split(",")[1], "base64");
  assert.strictEqual(decoded[0], 0xff);
  assert.strictEqual(decoded[1], 0xd8);
  assert.strictEqual(items[0].posterPath, undefined);
  assert.strictEqual(items[0].backdropPath, undefined);
});

test("列表封面：内联解密图片总量受桥接预算限制", async function () {
  const imageCount = 12;
  const cards = Array.from({ length: imageCount }, (_, index) =>
    '<div class="hg-drama-card"><a href="/video/' + (200 + index) + '/"><img data-src="https://pic.qnlycc.cn/upload/' + index + '.jpeg"></a><div class="hg-drama-card__title"><a>短剧 ' + index + '</a></div></div>'
  ).join("");
  const html = '<div class="hg-card-grid is-active" data-channel="latest">' + cards + "</div>";
  const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(600 * 1024, 0x44)]);
  const base64 = encryptCover(jpeg);
  const { api } = loadModule({
    get: async (url) => url.indexOf("/newest") >= 0
      ? { statusCode: 200, data: html }
      : { statusCode: 200, data: base64 },
  });
  const items = await api.loadNewest({ page: 1 });
  assert.strictEqual(items.length, imageCount);
  const jsonBytes = Buffer.byteLength(JSON.stringify(items));
  assert.ok(jsonBytes < 3 * 1024 * 1024, "列表结果应低于 3 MiB：" + jsonBytes);
  assert.ok(items.some((item) => item.coverUrl.indexOf("data:image/jpeg;base64,") === 0));
  assert.ok(items.some((item) => !item.coverUrl), "预算耗尽后应省略后续内联封面");
});

test("列表封面：配置 coverWorker 时直接走 Worker，不本地解密", async function () {
  const { api, calls } = loadModule({
    get: async (url) => {
      if (url.indexOf("/ai-duanju") >= 0) return { statusCode: 200, data: cardsHtml };
      return { statusCode: 200, data: "not-an-image" };
    },
  });
  const items = await api.loadAiDuanju({ page: 1, coverWorker: "https://worker.example/decrypt" });
  assert.strictEqual(
    items[0].coverUrl,
    "https://worker.example/decrypt?u=" + encodeURIComponent("https://huangguoai.com/cover/123.jpeg"),
  );
  assert.strictEqual(calls.gets.filter((c) => c.url.indexOf("worker.example") >= 0).length, 1, "Worker 应先做一次可用性检查");
});

test("已保存的失效 Worker 返回 403 时清除并回退本地解密", async function () {
  const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(80, 0x43)]);
  const base64 = encryptCover(jpeg);
  const { api, calls, storage } = loadModule({
    get: async (url) => {
      if (url.indexOf("/ai-duanju") >= 0) return { statusCode: 200, data: cardsHtml };
      if (url.indexOf("worker.example") >= 0) return { statusCode: 403, data: "host not allowed" };
      return { statusCode: 200, data: base64 };
    },
  });
  const items = await api.loadAiDuanju({ page: 1, coverWorker: "https://worker.example/decrypt" });
  assert.strictEqual(items.length, 1);
  assert.match(items[0].coverUrl, /^data:image\/jpeg;base64,/);
  assert.strictEqual(storage.has("hg_cover_worker"), false, "失效 Worker 地址应从存储中清除");
  assert.strictEqual(calls.gets.filter((c) => c.url.indexOf("worker.example") >= 0).length, 1);
});
