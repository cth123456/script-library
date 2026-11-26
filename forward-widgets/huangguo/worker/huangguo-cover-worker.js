const ALLOWED_HOSTS = new Set([
  "pic.qnlycc.cn",
  "new2.qnlycc.cn",
  "new.qnlycc.cn",
  "image.qnlycc.cn",
  "pic.aluxvl.cn",
]);

const IMAGE_KEY = new TextEncoder().encode("f5d965df75336270");
const IMAGE_IV = new TextEncoder().encode("97b60394abc2fbe1");
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const CACHE_SECONDS = 86400;
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";

function validateUrl(value) {
  const url = new URL(value);
  if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname) || url.username || url.password) {
    throw new Error("image host not allowed");
  }
  return url;
}

function concatBytes(first, second) {
  const result = new Uint8Array(first.length + second.length);
  result.set(first, 0);
  result.set(second, first.length);
  return result;
}

async function decryptNoPadding(ciphertext) {
  if (!ciphertext.length || ciphertext.length % 16 !== 0) return ciphertext;
  const key = await crypto.subtle.importKey("raw", IMAGE_KEY, { name: "AES-CBC" }, false, ["encrypt", "decrypt"]);
  const previousBlock = ciphertext.subarray(ciphertext.length - 16);
  const paddingBlock = new Uint8Array(16).fill(16);
  const encryptedPadding = new Uint8Array(await crypto.subtle.encrypt(
    { name: "AES-CBC", iv: previousBlock },
    key,
    paddingBlock,
  ));
  const finalBlock = encryptedPadding.subarray(0, 16);
  const paddedCiphertext = concatBytes(ciphertext, finalBlock);
  return new Uint8Array(await crypto.subtle.decrypt(
    { name: "AES-CBC", iv: IMAGE_IV },
    key,
    paddedCiphertext,
  ));
}

function imageType(bytes) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return "image/webp";
  if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return "image/gif";
  return "";
}

function trimContainerPadding(bytes) {
  if (bytes.length < 12 || bytes[0] !== 0x52 || bytes[1] !== 0x49 || bytes[2] !== 0x46 || bytes[3] !== 0x46) return bytes;
  const declaredSize = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(4, true) + 8;
  return declaredSize >= 12 && declaredSize <= bytes.length ? bytes.subarray(0, declaredSize) : bytes;
}

function response(body, status, contentType) {
  return new Response(body, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Cache-Control": "public, max-age=" + CACHE_SECONDS,
      "Content-Type": contentType || "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export default {
  async fetch(request, env, context) {
    if (request.method === "OPTIONS") return response(null, 204);
    if (request.method !== "GET" && request.method !== "HEAD") return response("method not allowed", 405);

    const requestUrl = new URL(request.url);
    const targetValue = requestUrl.searchParams.get("u") || requestUrl.searchParams.get("url");
    if (!targetValue) return response("usage: /?u=<encoded image URL>", 400);

    let target;
    try {
      target = validateUrl(targetValue);
    } catch (_) {
      return response("image host not allowed", 403);
    }

    const cache = caches.default;
    const cacheKey = new Request(requestUrl.origin + requestUrl.pathname + "?u=" + encodeURIComponent(target.origin + target.pathname));
    const cached = await cache.match(cacheKey);
    if (cached) return request.method === "HEAD" ? new Response(null, cached) : cached;

    let upstreamUrl = target;
    let upstream;
    for (let redirect = 0; redirect <= 3; redirect++) {
      upstream = await fetch(upstreamUrl, {
        headers: {
          Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
          Referer: "https://huangguoai.com/",
          "User-Agent": USER_AGENT,
        },
        redirect: "manual",
      });
      if (upstream.status < 300 || upstream.status >= 400) break;
      const location = upstream.headers.get("location");
      if (!location || redirect === 3) return response("image redirect rejected", 502);
      try {
        upstreamUrl = validateUrl(new URL(location, upstreamUrl).href);
      } catch (_) {
        return response("image redirect host not allowed", 403);
      }
    }
    if (!upstream || !upstream.ok) return response("upstream image failed", 502);

    const declaredLength = Number(upstream.headers.get("content-length") || 0);
    if (declaredLength > MAX_IMAGE_BYTES) return response("image too large", 413);
    const ciphertext = new Uint8Array(await upstream.arrayBuffer());
    if (!ciphertext.length || ciphertext.length > MAX_IMAGE_BYTES) return response("image too large or empty", 413);

    let plaintext;
    try {
      plaintext = await decryptNoPadding(ciphertext);
    } catch (_) {
      plaintext = ciphertext;
    }
    plaintext = trimContainerPadding(plaintext);
    const type = imageType(plaintext);
    if (!type) return response("unsupported image data", 502);

    const result = response(plaintext, 200, type);
    if (context && context.waitUntil) context.waitUntil(cache.put(cacheKey, result.clone()));
    return request.method === "HEAD" ? response(null, 200, type) : result;
  },
};
