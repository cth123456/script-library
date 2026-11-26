"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const workerPath = path.join(__dirname, "..", "worker", "huangguo-cover-worker.js");
const workerSource = fs.readFileSync(workerPath, "utf8");
const keyMatch = workerSource.match(/IMAGE_KEY\s*=\s*new TextEncoder\(\)\.encode\("([^"]+)"\)/);
const ivMatch = workerSource.match(/IMAGE_IV\s*=\s*new TextEncoder\(\)\.encode\("([^"]+)"\)/);
assert.ok(keyMatch && ivMatch, "Worker exposes the site image protocol values in constants");

function encryptNoPadding(bytes) {
  const padded = Buffer.alloc(Math.ceil(bytes.length / 16) * 16);
  bytes.copy(padded);
  const cipher = crypto.createCipheriv("aes-128-cbc", Buffer.from(keyMatch[1]), Buffer.from(ivMatch[1]));
  cipher.setAutoPadding(false);
  return Buffer.concat([cipher.update(padded), cipher.final()]);
}

function loadWorker(upstream) {
  const cacheValues = new Map();
  const caches = {
    default: {
      async match(request) { return cacheValues.get(request.url); },
      async put(request, value) { cacheValues.set(request.url, value); },
    },
  };
  const context = {
    module: { exports: {} },
    crypto: crypto.webcrypto,
    caches,
    fetch: upstream,
    Request,
    Response,
    URL,
    TextEncoder,
    Uint8Array,
    Set,
  };
  vm.runInNewContext(workerSource.replace("export default {", "module.exports = {"), context, { timeout: 2000 });
  return context.module.exports;
}

test("Worker 解密新图床 ciphertext 并返回可缓存的 HTTPS 图片响应", async function () {
  const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(124, 0x41)]);
  const ciphertext = encryptNoPadding(jpeg);
  let upstreamCalls = 0;
  const worker = loadWorker(async () => {
    upstreamCalls++;
    return new Response(ciphertext, { status: 200, headers: { "content-length": String(ciphertext.length) } });
  });
  const requestUrl = "https://cover.example.workers.dev/?u=" + encodeURIComponent("https://pic.qnlycc.cn/upload_01/test.jpeg");
  const response = await worker.fetch(new Request(requestUrl), {}, { waitUntil() {} });
  const plaintext = Buffer.from(await response.arrayBuffer());
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.headers.get("content-type"), "image/jpeg");
  assert.strictEqual(response.headers.get("access-control-allow-origin"), "*");
  assert.strictEqual(plaintext.length, jpeg.length, "NoPadding 解密必须去掉 WebCrypto 合成的填充块");
  assert.deepStrictEqual(plaintext.subarray(0, 4), jpeg.subarray(0, 4));
  const cached = await worker.fetch(new Request(requestUrl), {}, { waitUntil() {} });
  assert.strictEqual(cached.status, 200);
  assert.strictEqual(upstreamCalls, 1, "cache hit should skip the image origin");
});

test("Worker 拒绝非白名单图床和重定向到外部主机", async function () {
  let calls = 0;
  const worker = loadWorker(async () => {
    calls++;
    return new Response(null, { status: 302, headers: { location: "https://evil.example/image.jpg" } });
  });
  const badHost = await worker.fetch(new Request("https://cover.example.workers.dev/?u=" + encodeURIComponent("https://evil.example/a.jpg")), {}, { waitUntil() {} });
  assert.strictEqual(badHost.status, 403);
  const redirect = await worker.fetch(new Request("https://cover.example.workers.dev/?u=" + encodeURIComponent("https://pic.qnlycc.cn/a.jpg")), {}, { waitUntil() {} });
  assert.strictEqual(redirect.status, 403);
  assert.strictEqual(calls, 1);
});

test("Worker trims AES padding after RIFF-declared WebP data", async function () {
  const webp = Buffer.alloc(32, 0x41);
  webp.write("RIFF", 0, "ascii");
  webp.writeUInt32LE(24, 4);
  webp.write("WEBP", 8, "ascii");
  const ciphertext = encryptNoPadding(webp);
  const worker = loadWorker(async () => new Response(ciphertext, { status: 200 }));
  const url = "https://cover.example.workers.dev/?u=" + encodeURIComponent("https://new2.qnlycc.cn/test.webp");
  const response = await worker.fetch(new Request(url), {}, { waitUntil() {} });
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.strictEqual(response.status, 200);
  assert.strictEqual(bytes.length, webp.length);
  assert.deepStrictEqual(bytes, webp);
});
