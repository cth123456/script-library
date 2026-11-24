WidgetMetadata = {
  id: "HuangGuo.DuanJu_TuT",
  title: "黄果短剧",
  description: "黄果短剧列表、分类、搜索、详情及按集实时取播放地址。",
  author: "Codex",
  version: "0.1.5",
  requiredVersion: "0.0.1",
  detailCacheDuration: 0,
  site: "https://huangguoai.com",
  icon: "https://huangguoai.com/favicon.ico",
  globalParams: [
    {
      name: "coverWorker",
      title: "封面解密 Worker",
      type: "input",
      value: "",
      description: "留空则使用站点官方 WebP 备用地址；如有自己的 AES 图片解密 Worker，可填 Worker 地址（?u= 或 ?url= 形式）。",
    },
  ],
  modules: [
    {
      title: "热门推荐",
      functionName: "loadRecommend",
      cacheDuration: 600,
      params: [{ name: "page", title: "页码", type: "page", value: "1" }],
    },
    {
      title: "最近上新",
      functionName: "loadNewest",
      cacheDuration: 600,
      params: [{ name: "page", title: "页码", type: "page", value: "1" }],
    },
    {
      title: "AI短剧",
      functionName: "loadAiDuanju",
      cacheDuration: 600,
      params: [
        {
          name: "channel",
          title: "排序",
          type: "enumeration",
          value: "latest",
          enumOptions: [
            { title: "最新更新", value: "latest" },
            { title: "当前热播", value: "hot" },
            { title: "独家原创", value: "original" },
            { title: "随机推荐", value: "random" },
          ],
        },
        { name: "page", title: "页码", type: "page", value: "1" },
      ],
    },
    {
      title: "AI漫剧",
      functionName: "loadAiManju",
      cacheDuration: 600,
      params: [
        {
          name: "channel",
          title: "排序",
          type: "enumeration",
          value: "latest",
          enumOptions: [
            { title: "最新更新", value: "latest" },
            { title: "当前热播", value: "hot" },
            { title: "独家原创", value: "original" },
            { title: "随机推荐", value: "random" },
          ],
        },
        { name: "page", title: "页码", type: "page", value: "1" },
      ],
    },
    {
      title: "专题",
      functionName: "loadTopics",
      cacheDuration: 600,
      params: [
        {
          name: "topic",
          title: "专题",
          type: "enumeration",
          value: "hot-aiduanju",
          enumOptions: [
            { title: "精品高分短剧", value: "hot-aiduanju" },
            { title: "家庭伦理短剧", value: "luanlun-aiduanju" },
            { title: "灵异诡事短剧", value: "paranormal-aiduanju" },
            { title: "欧美精选短剧", value: "oumei-duanju" },
          ],
        },
        { name: "page", title: "页码", type: "page", value: "1" },
      ],
    },
    {
      title: "排行榜",
      functionName: "loadRanking",
      cacheDuration: 600,
      params: [
        {
          name: "ranking",
          title: "榜单",
          type: "enumeration",
          value: "hot",
          enumOptions: [
            { title: "热播榜", value: "hot" },
            { title: "推荐榜", value: "recommend" },
            { title: "潜力榜", value: "potential" },
          ],
        },
        { name: "page", title: "页码", type: "page", value: "1" },
      ],
    },
    {
      id: "loadResource",
      title: "黄果短剧播放资源",
      functionName: "loadResource",
      type: "stream",
      cacheDuration: 0,
      params: [],
    },
  ],
  search: {
    title: "搜索",
    functionName: "searchVideos",
    params: [
      { name: "keyword", title: "剧名", type: "input", value: "" },
      { name: "page", title: "页码", type: "page", value: "1" },
    ],
  },
};

var HUANGGUO_SITE = "https://huangguoai.com";
var HUANGGUO_STORAGE_WORKER = "hg_cover_worker";
var HG_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";
var HUANGGUO_WORKER_PROBES = Object.create(null);
var HUANGGUO_CATEGORIES = {
  aiDuanju: "/ai-duanju/",
  aiManju: "/ai-manju/",
};
var HUANGGUO_TOPICS = [
  "hot-aiduanju",
  "luanlun-aiduanju",
  "paranormal-aiduanju",
  "oumei-duanju",
];
var HUANGGUO_RANKINGS = ["hot", "recommend", "potential"];
var HUANGGUO_EPISODE_LIMIT = 300;

function hgPageNumber(value) {
  var page = parseInt(value, 10);
  return Number.isFinite(page) && page > 0 ? Math.min(page, 200) : 1;
}

function hgText(value) {
  return String(value || "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#x([\da-f]+);/gi, function (_, code) {
      return String.fromCharCode(parseInt(code, 16));
    })
    .replace(/&#(\d+);/g, function (_, code) {
      return String.fromCharCode(parseInt(code, 10));
    })
    .replace(/\s+/g, " ")
    .trim();
}

function hgAbsoluteUrl(value) {
  var url = String(value || "").trim().replace(/&amp;/g, "&");
  if (!url || /^(?:data|blob|javascript):/i.test(url)) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (url.indexOf("//") === 0) return "https:" + url;
  return HUANGGUO_SITE + (url.charAt(0) === "/" ? url : "/" + url);
}

function hgAttribute(tag, name) {
  var escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  var match = String(tag || "").match(
    new RegExp("\\b" + escaped + "\\s*=\\s*['\"]([^'\"]*)", "i"),
  );
  return match ? hgText(match[1]) : "";
}

function hgCoverSource(tag) {
  var names = ["data-src", "data-lazy-src", "data-bg", "data-cover", "data-image", "data-thumb", "src"];
  for (var i = 0; i < names.length; i++) {
    var value = hgAttribute(tag, names[i]);
    if (value && !/cover-placeholder|avatar-default/i.test(value)) return hgAbsoluteUrl(value);
  }
  return "";
}

async function hgWorkerUrl(params) {
  var override = String((params && params.coverWorker) || "").trim().replace(/\/+$/, "");
  if (override) {
    try {
      if (Widget.storage && Widget.storage.set) await Widget.storage.set(HUANGGUO_STORAGE_WORKER, override);
    } catch (_) {}
    return override;
  }
  try {
    var saved = await Widget.storage.get(HUANGGUO_STORAGE_WORKER);
    if (typeof saved === "string" && /^https:\/\//i.test(saved)) return saved.replace(/\/+$/, "");
  } catch (_) {}
  return "";
}

function hgCoverUrl(source, worker) {
  if (!source || !worker) return source || "";
  if (source.indexOf(worker) === 0) return source;
  if (/[?&](?:u|url)=/i.test(worker)) return worker + encodeURIComponent(source);
  return worker + (worker.indexOf("?") >= 0 ? "&" : "?") + "u=" + encodeURIComponent(source);
}

async function hgCoverWorkerAvailable(source, worker) {
  if (!source || !worker) return false;
  if (HUANGGUO_WORKER_PROBES[worker] !== undefined) return HUANGGUO_WORKER_PROBES[worker];
  try {
    var response = await Widget.http.get(hgCoverUrl(source, worker), {
      headers: { "User-Agent": HG_UA, Accept: "image/avif,image/webp,image/*,*/*;q=0.8", Referer: HUANGGUO_SITE + "/" },
    });
    var status = Number(response && (response.statusCode || response.status)) || 0;
    var contentType = "";
    var responseHeaders = response && response.headers;
    if (responseHeaders) {
      for (var key in responseHeaders) {
        if (key.toLowerCase() === "content-type") contentType = String(responseHeaders[key]);
      }
    }
    var available = status >= 200 && status < 300 && (!contentType || /^image\//i.test(contentType));
    HUANGGUO_WORKER_PROBES[worker] = available;
    if (!available) await hgForgetCoverWorker(worker);
    return available;
  } catch (_) {
    HUANGGUO_WORKER_PROBES[worker] = false;
    await hgForgetCoverWorker(worker);
    return false;
  }
}

async function hgForgetCoverWorker(worker) {
  if (!worker) return;
  try {
    if (Widget.storage && typeof Widget.storage.get === "function" && typeof Widget.storage.remove === "function") {
      var saved = await Widget.storage.get(HUANGGUO_STORAGE_WORKER);
      if (typeof saved === "string" && saved.replace(/\/+$/, "") === worker) {
        await Widget.storage.remove(HUANGGUO_STORAGE_WORKER);
      }
    }
  } catch (_) {}
}

function hgUnwrapCoverWorker(source, worker) {
  var text = String(source || "");
  if (!worker || text.indexOf(worker) !== 0) return text;
  var match = text.match(/[?&](?:u|url)=([^&#]*)/i);
  if (!match) return text;
  try {
    return decodeURIComponent(match[1]);
  } catch (_) {
    return match[1];
  }
}

/* ---------------- 封面解密（站点图床 AES-128-CBC / NoPadding） ----------------
 * 站点把封面加密后再下发，前端用 crypto-image-protocol 的公开 key/IV 解密。
 * REX 客户端不会解密，所以未配置 Worker 时由模块取回密文并本地解密成 data URL。
 * key/IV 来自站点公开脚本，不含任何登录凭据。
 */
var HUANGGUO_COVER_KEY = "f5d965df75336270";
var HUANGGUO_COVER_IV = "97b60394abc2fbe1";
var HUANGGUO_WEBP_BASE = "https://new2.qnlycc.cn";
var HUANGGUO_COVER_CONCURRENCY = 4;
var HUANGGUO_COVER_CACHE = {};

var HG_B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function hgBase64ToBytes(text) {
  var value = String(text || "").replace(/[\r\n\t ]/g, "").replace(/-/g, "+").replace(/_/g, "/");
  while (value.length % 4) value += "=";
  var bytes = [];
  var buffer = 0;
  var bits = 0;
  for (var i = 0; i < value.length; i++) {
    var ch = value.charAt(i);
    if (ch === "=") break;
    var index = HG_B64.indexOf(ch);
    if (index < 0) return null;
    buffer = (buffer << 6) | index;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return Uint8Array.from(bytes);
}

function hgBytesToBase64(bytes) {
  var out = "";
  for (var i = 0; i < bytes.length; i += 3) {
    var b0 = bytes[i];
    var b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    var b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    out += HG_B64.charAt(b0 >> 2);
    out += HG_B64.charAt(((b0 & 3) << 4) | (b1 >> 4));
    out += i + 1 < bytes.length ? HG_B64.charAt(((b1 & 15) << 2) | (b2 >> 6)) : "=";
    out += i + 2 < bytes.length ? HG_B64.charAt(b2 & 63) : "=";
  }
  return out;
}

function hgAsciiBytes(text) {
  var bytes = new Uint8Array(text.length);
  for (var i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i) & 0xff;
  return bytes;
}

var HG_AES_EXP = new Uint8Array(512);
var HG_AES_LOG = new Uint8Array(256);
var HG_AES_SBOX = new Uint8Array(256);
var HG_AES_ISBOX = new Uint8Array(256);
var HG_AES_TD = [null, null, null, null];
var HG_AES_RCON = [0, 1, 2, 4, 8, 16, 32, 64, 128, 27, 54];

(function hgAesInit() {
  var x = 1;
  for (var i = 0; i < 255; i++) {
    HG_AES_EXP[i] = x;
    HG_AES_LOG[x] = i;
    // 乘 3（AES 的生成元）：xtime(x) ^ x
    x = ((((x << 1) ^ (x & 0x80 ? 0x11b : 0)) & 0xff) ^ x);
  }
  for (var j = 255; j < 512; j++) HG_AES_EXP[j] = HG_AES_EXP[j - 255];
  function rotl(v, n) {
    return ((v << n) | (v >> (8 - n))) & 0xff;
  }
  for (var t = 0; t < 256; t++) {
    var inv = t ? HG_AES_EXP[255 - HG_AES_LOG[t]] : 0;
    var s = inv ^ rotl(inv, 1) ^ rotl(inv, 2) ^ rotl(inv, 3) ^ rotl(inv, 4) ^ 0x63;
    HG_AES_SBOX[t] = s;
    HG_AES_ISBOX[s] = t;
  }
  // 逆 T 表：一次查表合并 InvSubBytes + InvMixColumns（按行系数排列）。
  for (var k = 0; k < 4; k++) HG_AES_TD[k] = new Uint32Array(256);
  for (var b = 0; b < 256; b++) {
    var v = HG_AES_ISBOX[b];
    HG_AES_TD[0][b] = ((hgAesMul(v, 14) << 24) | (hgAesMul(v, 9) << 16) | (hgAesMul(v, 13) << 8) | hgAesMul(v, 11)) >>> 0;
    HG_AES_TD[1][b] = ((hgAesMul(v, 11) << 24) | (hgAesMul(v, 14) << 16) | (hgAesMul(v, 9) << 8) | hgAesMul(v, 13)) >>> 0;
    HG_AES_TD[2][b] = ((hgAesMul(v, 13) << 24) | (hgAesMul(v, 11) << 16) | (hgAesMul(v, 14) << 8) | hgAesMul(v, 9)) >>> 0;
    HG_AES_TD[3][b] = ((hgAesMul(v, 9) << 24) | (hgAesMul(v, 13) << 16) | (hgAesMul(v, 11) << 8) | hgAesMul(v, 14)) >>> 0;
  }
})();

function hgAesMul(a, b) {
  if (!a || !b) return 0;
  return HG_AES_EXP[HG_AES_LOG[a] + HG_AES_LOG[b]];
}

function hgAesInvMixWord(word) {
  var a0 = (word >>> 24) & 0xff;
  var a1 = (word >>> 16) & 0xff;
  var a2 = (word >>> 8) & 0xff;
  var a3 = word & 0xff;
  return (
    ((hgAesMul(a0, 14) ^ hgAesMul(a1, 11) ^ hgAesMul(a2, 13) ^ hgAesMul(a3, 9)) << 24) |
    ((hgAesMul(a0, 9) ^ hgAesMul(a1, 14) ^ hgAesMul(a2, 11) ^ hgAesMul(a3, 13)) << 16) |
    ((hgAesMul(a0, 13) ^ hgAesMul(a1, 9) ^ hgAesMul(a2, 14) ^ hgAesMul(a3, 11)) << 8) |
    (hgAesMul(a0, 11) ^ hgAesMul(a1, 13) ^ hgAesMul(a2, 9) ^ hgAesMul(a3, 14))
  ) >>> 0;
}

// 密钥扩展：返回加密轮密钥 rk 与等价逆密码所需的 dw = InvMixColumns(rk)。
function hgAesExpandKey(key) {
  var w = new Uint8Array(176);
  w.set(key);
  var b = 16;
  for (var r = 1; r <= 10; r++) {
    var t = [w[b - 4], w[b - 3], w[b - 2], w[b - 1]];
    t = [
      HG_AES_SBOX[t[1]] ^ HG_AES_RCON[r],
      HG_AES_SBOX[t[2]],
      HG_AES_SBOX[t[3]],
      HG_AES_SBOX[t[0]],
    ];
    for (var i = 0; i < 4; i++) {
      w[b] = w[b - 16] ^ t[i];
      b++;
    }
    for (var k = 0; k < 12; k++) {
      w[b] = w[b - 16] ^ w[b - 4];
      b++;
    }
  }
  var rk = new Uint32Array(44);
  for (var n = 0; n < 44; n++) {
    rk[n] = ((w[4 * n] << 24) | (w[4 * n + 1] << 16) | (w[4 * n + 2] << 8) | w[4 * n + 3]) >>> 0;
  }
  var dw = new Uint32Array(44);
  for (var m = 0; m < 44; m++) dw[m] = hgAesInvMixWord(rk[m]);
  return { rk: rk, dw: dw };
}

function hgAesDecryptBlockWords(t0, t1, t2, t3, rk, dw) {
  var a = (t0 ^ rk[40]) >>> 0;
  var b = (t1 ^ rk[41]) >>> 0;
  var c = (t2 ^ rk[42]) >>> 0;
  var d = (t3 ^ rk[43]) >>> 0;
  for (var round = 9; round >= 1; round--) {
    var o = 4 * round;
    var s0 = (HG_AES_TD[0][a >>> 24] ^ HG_AES_TD[1][(d >>> 16) & 0xff] ^ HG_AES_TD[2][(c >>> 8) & 0xff] ^ HG_AES_TD[3][b & 0xff] ^ dw[o]) >>> 0;
    var s1 = (HG_AES_TD[0][b >>> 24] ^ HG_AES_TD[1][(a >>> 16) & 0xff] ^ HG_AES_TD[2][(d >>> 8) & 0xff] ^ HG_AES_TD[3][c & 0xff] ^ dw[o + 1]) >>> 0;
    var s2 = (HG_AES_TD[0][c >>> 24] ^ HG_AES_TD[1][(b >>> 16) & 0xff] ^ HG_AES_TD[2][(a >>> 8) & 0xff] ^ HG_AES_TD[3][d & 0xff] ^ dw[o + 2]) >>> 0;
    var s3 = (HG_AES_TD[0][d >>> 24] ^ HG_AES_TD[1][(c >>> 16) & 0xff] ^ HG_AES_TD[2][(b >>> 8) & 0xff] ^ HG_AES_TD[3][a & 0xff] ^ dw[o + 3]) >>> 0;
    a = s0;
    b = s1;
    c = s2;
    d = s3;
  }
  var o0 = (((HG_AES_ISBOX[a >>> 24] << 24) | (HG_AES_ISBOX[(d >>> 16) & 0xff] << 16) | (HG_AES_ISBOX[(c >>> 8) & 0xff] << 8) | HG_AES_ISBOX[b & 0xff]) >>> 0) ^ rk[0];
  var o1 = (((HG_AES_ISBOX[b >>> 24] << 24) | (HG_AES_ISBOX[(a >>> 16) & 0xff] << 16) | (HG_AES_ISBOX[(d >>> 8) & 0xff] << 8) | HG_AES_ISBOX[c & 0xff]) >>> 0) ^ rk[1];
  var o2 = (((HG_AES_ISBOX[c >>> 24] << 24) | (HG_AES_ISBOX[(b >>> 16) & 0xff] << 16) | (HG_AES_ISBOX[(a >>> 8) & 0xff] << 8) | HG_AES_ISBOX[d & 0xff]) >>> 0) ^ rk[2];
  var o3 = (((HG_AES_ISBOX[d >>> 24] << 24) | (HG_AES_ISBOX[(c >>> 16) & 0xff] << 16) | (HG_AES_ISBOX[(b >>> 8) & 0xff] << 8) | HG_AES_ISBOX[a & 0xff]) >>> 0) ^ rk[3];
  return [o0 >>> 0, o1 >>> 0, o2 >>> 0, o3 >>> 0];
}

function hgAesCbcDecrypt(cipher, key, iv) {
  if (!cipher || !cipher.length || cipher.length % 16 !== 0) return null;
  var expanded = hgAesExpandKey(key);
  var rk = expanded.rk;
  var dw = expanded.dw;
  var out = new Uint8Array(cipher.length);
  var p0 = ((iv[0] << 24) | (iv[1] << 16) | (iv[2] << 8) | iv[3]) >>> 0;
  var p1 = ((iv[4] << 24) | (iv[5] << 16) | (iv[6] << 8) | iv[7]) >>> 0;
  var p2 = ((iv[8] << 24) | (iv[9] << 16) | (iv[10] << 8) | iv[11]) >>> 0;
  var p3 = ((iv[12] << 24) | (iv[13] << 16) | (iv[14] << 8) | iv[15]) >>> 0;
  for (var o = 0; o < cipher.length; o += 16) {
    var c0 = ((cipher[o] << 24) | (cipher[o + 1] << 16) | (cipher[o + 2] << 8) | cipher[o + 3]) >>> 0;
    var c1 = ((cipher[o + 4] << 24) | (cipher[o + 5] << 16) | (cipher[o + 6] << 8) | cipher[o + 7]) >>> 0;
    var c2 = ((cipher[o + 8] << 24) | (cipher[o + 9] << 16) | (cipher[o + 10] << 8) | cipher[o + 11]) >>> 0;
    var c3 = ((cipher[o + 12] << 24) | (cipher[o + 13] << 16) | (cipher[o + 14] << 8) | cipher[o + 15]) >>> 0;
    var dec = hgAesDecryptBlockWords(c0, c1, c2, c3, rk, dw);
    var d0 = (dec[0] ^ p0) >>> 0;
    var d1 = (dec[1] ^ p1) >>> 0;
    var d2 = (dec[2] ^ p2) >>> 0;
    var d3 = (dec[3] ^ p3) >>> 0;
    out[o] = d0 >>> 24;
    out[o + 1] = (d0 >>> 16) & 0xff;
    out[o + 2] = (d0 >>> 8) & 0xff;
    out[o + 3] = d0 & 0xff;
    out[o + 4] = d1 >>> 24;
    out[o + 5] = (d1 >>> 16) & 0xff;
    out[o + 6] = (d1 >>> 8) & 0xff;
    out[o + 7] = d1 & 0xff;
    out[o + 8] = d2 >>> 24;
    out[o + 9] = (d2 >>> 16) & 0xff;
    out[o + 10] = (d2 >>> 8) & 0xff;
    out[o + 11] = d2 & 0xff;
    out[o + 12] = d3 >>> 24;
    out[o + 13] = (d3 >>> 16) & 0xff;
    out[o + 14] = (d3 >>> 8) & 0xff;
    out[o + 15] = d3 & 0xff;
    p0 = c0;
    p1 = c1;
    p2 = c2;
    p3 = c3;
  }
  return out;
}

function hgImageMime(bytes) {
  if (!bytes || bytes.length < 4) return "";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return "image/gif";
  if (
    bytes.length > 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return "";
}

// 密文候选：原签名地址优先，失败再试无需鉴权的 WebP 变体。
function hgCoverCandidates(source) {
  var list = [];
  var text = String(source || "");
  if (/^https:\/\//i.test(text)) list.push(text);
  // 站点官方 WebP 备用域无需签名且带长期缓存；当 original 是加密图床时优先用这个镜像路径。
  var match = text.match(/^https:\/\/(?:pic\.qnlycc\.cn|new\.qnlycc\.cn|image\.qnlycc\.cn|pic\.aluxvl\.cn)(\/[^?#]*)/i);
  if (match && /\.(?:jpe?g|png|bmp)$/i.test(match[1])) {
    var webp = HUANGGUO_WEBP_BASE + match[1] + ".webp";
    if (list.indexOf(webp) < 0) list.unshift(webp);
  }
  return list;
}

async function hgDecryptCover(source) {
  if (!source || source.indexOf("data:") === 0) return source || "";
  if (HUANGGUO_COVER_CACHE[source]) return HUANGGUO_COVER_CACHE[source];
  var candidates = hgCoverCandidates(source);
  var key = hgAsciiBytes(HUANGGUO_COVER_KEY);
  var iv = hgAsciiBytes(HUANGGUO_COVER_IV);
  for (var i = 0; i < candidates.length; i++) {
    try {
      var response = await Widget.http.get(candidates[i], {
        headers: { "User-Agent": HG_UA, Accept: "image/avif,image/webp,image/*,*/*;q=0.8", Referer: HUANGGUO_SITE + "/" },
        base64Data: true,
      });
      var status = Number(response && (response.statusCode || response.status)) || 0;
      if (status >= 400) continue;
      var data = response && response.data;
      if (typeof data !== "string" || !data) continue;
      var cipher = hgBase64ToBytes(data);
      if (!cipher || !cipher.length || cipher.length % 16 !== 0) continue;
      var plain = hgAesCbcDecrypt(cipher, key, iv);
      var mime = hgImageMime(plain);
      if (!mime) continue;
      var url = "data:" + mime + ";base64," + hgBytesToBase64(plain);
      HUANGGUO_COVER_CACHE[source] = url;
      return url;
    } catch (_) {
      // 尝试下一个候选
    }
  }
  return "";
}

// 未配置 Worker 时，把解析出的加密封面就地解密成 data URL。
async function hgDecorateCovers(items) {
  var list = items || [];
  var index = 0;
  async function run() {
    while (index < list.length) {
      var item = list[index++];
      var source = item && item.coverUrl;
      if (!source || source.indexOf("data:") === 0) continue;
      var url = await hgDecryptCover(source);
      if (url) {
        item.coverUrl = url;
        item.posterPath = url;
        item.backdropPath = url;
      }
    }
  }
  var runners = [];
  var count = Math.min(HUANGGUO_COVER_CONCURRENCY, list.length);
  for (var i = 0; i < count; i++) runners.push(run());
  await Promise.all(runners);
  return list;
}

function hgListUrl(path, page, sort) {
  var question = path.indexOf("?");
  var pathname = question >= 0 ? path.slice(0, question) : path;
  var query = question >= 0 ? path.slice(question + 1) : "";
  var widgetPath = pathname + (query ? "?" + query : "") + (sort ? (query ? "&" : "?") + "sort=" + encodeURIComponent(sort) : "");
  var params = [];
  if (query) params.push(query);
  if (sort) params.push("sort=" + encodeURIComponent(sort));
  params.push("page=" + hgPageNumber(page));
  params.push("_hg_widget=" + encodeURIComponent(widgetPath));
  return HUANGGUO_SITE + pathname + "?" + params.join("&");
}

async function hgGetPage(url, referer) {
  var response = await Widget.http.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.7",
      Referer: referer || HUANGGUO_SITE + "/",
    },
  });
  var status = Number(response && (response.statusCode || response.status)) || 0;
  var body = response && response.data;
  if (status >= 400) {
    console.warn("黄果页面请求失败", status, url);
    return { status: status, html: "" };
  }
  var html = typeof body === "string" ? body : body == null ? "" : JSON.stringify(body);
  if (/内容已下线|页面不存在|404 Not Found/i.test(html)) {
    console.warn("黄果分类或内容已下线", url);
    return { status: status || 410, html: "" };
  }
  return { status: status || 200, html: html };
}

function hgVisibleRegion(html, channel) {
  var source = String(html || "").replace(/<template\b[\s\S]*?<\/template>/gi, "");
  var grids = [];
  var pattern = /<div\b[^>]*class=["'][^"']*\bhg-card-grid\b[^"']*["'][^>]*>/gi;
  var match;
  while ((match = pattern.exec(source))) grids.push({ index: match.index, tag: match[0] });
  if (!grids.length) return source;
  var selected = null;
  for (var i = 0; i < grids.length; i++) {
    if ((channel === "latest" && /\bis-active\b/i.test(grids[i].tag)) || new RegExp("(?:data-channel-panel|data-channel|data-sort|data-tab|id)=[\"'][^\"']*" + channel + "[^\"']*[\"']", "i").test(grids[i].tag)) {
      selected = grids[i];
      break;
    }
  }
  if (!selected) selected = grids[channel === "hot" ? 1 : channel === "original" ? 2 : channel === "random" ? 3 : 0] || grids[0];
  var end = source.slice(selected.index + selected.tag.length).search(/<div\b[^>]*class=["'][^"']*\bhg-card-grid\b/i);
  return end < 0 ? source.slice(selected.index) : source.slice(selected.index, selected.index + selected.tag.length + end);
}

function hgParseCards(html, worker, channel) {
  var source = hgVisibleRegion(html, channel);
  var starts = [];
  var pattern = /<div\b[^>]*class=["'][^"']*\bhg-drama-card\b[^"']*["'][^>]*>/gi;
  var match;
  while ((match = pattern.exec(source))) starts.push(match.index);
  var items = [];
  var seen = Object.create(null);
  for (var i = 0; i < starts.length; i++) {
    var card = source.slice(starts[i], starts[i + 1] || source.length);
    var linkMatch = card.match(/href=["'](?:https?:\/\/huangguoai\.com)?\/(?:video|detail)\/(\d+)\/?["']/i);
    if (!linkMatch || seen[linkMatch[1]]) continue;
    var id = linkMatch[1];
    var image = card.match(/<img\b[^>]*>/i);
    var titleMatch = card.match(/data-track-title=["']([^"']+)|class=["'][^"']*hg-drama-card__title[^"']*["'][^>]*>[\s\S]*?<a\b[^>]*>([\s\S]*?)<\/a>/i);
    var title = hgText(titleMatch && (titleMatch[1] || titleMatch[2] || "")) || "黄果短剧 " + id;
    var scoreMatch = card.match(/hg-drama-card__score[^>]*>([\s\S]*?)<\//i);
    var episodeMatch = card.match(/hg-drama-card__episode[^>]*>([\s\S]*?)<\//i);
    var poster = hgCoverUrl(hgCoverSource(image ? image[0] : ""), worker);
    var link = "hg://detail/" + id + "/" + (poster ? "?cover=" + encodeURIComponent(poster) : "");
    seen[id] = true;
    items.push({
      id: link,
      type: "url",
      mediaType: "tv",
      title: title,
      description: hgText(episodeMatch && episodeMatch[1]),
      link: link,
      coverUrl: poster,
      posterPath: poster,
      backdropPath: poster,
      rating: scoreMatch ? parseFloat(hgText(scoreMatch[1]).replace(/[^0-9.]/g, "")) || undefined : undefined,
    });
  }
  return items;
}

async function hgLoadList(path, params, sort) {
  params = params || {};
  var pageUrl = hgListUrl(path, params.page, sort);
  var response = await hgGetPage(pageUrl, params.referer || HUANGGUO_SITE + "/");
  if (response.status >= 400 || !response.html) return [];
  var worker = await hgWorkerUrl(params);
  var rawItems = hgParseCards(response.html, "", sort || "latest");
  if (worker && rawItems.length && !(await hgCoverWorkerAvailable(rawItems[0].coverUrl, worker))) worker = "";
  var items = worker ? hgParseCards(response.html, worker, sort || "latest") : rawItems;
  if (!worker && items.length) items = await hgDecorateCovers(items);
  return items;
}

async function loadRecommend(params) { return hgLoadList("/recommend", params); }
async function loadNewest(params) { return hgLoadList("/newest", params); }
async function loadAiDuanju(params) { return hgLoadList("/ai-duanju/", params, params && params.channel); }
async function loadAiManju(params) { return hgLoadList("/ai-manju/", params, params && params.channel); }

async function loadTopics(params) {
  params = params || {};
  var topic = HUANGGUO_TOPICS.indexOf(String(params.topic || "")) >= 0 ? String(params.topic) : HUANGGUO_TOPICS[0];
  return hgLoadList("/topics/" + topic + "/", params);
}

async function loadRanking(params) {
  params = params || {};
  var ranking = ["hot", "recommend", "potential"].indexOf(String(params.ranking || "")) >= 0 ? String(params.ranking) : "hot";
  return hgLoadList("/ranks/" + ranking + "/", params);
}

async function searchVideos(params) {
  params = params || {};
  var keyword = String(params.keyword || params.query || "").trim();
  if (!keyword) return [];
  var page = hgPageNumber(params.page);
  var first = "/search/?keyword=" + encodeURIComponent(keyword);
  var result = await hgLoadList(first, params);
  if (result.length) return result;
  return hgLoadList("/search/video/" + encodeURIComponent(keyword) + "/", params);
}

function hgParseDetailLink(value) {
  var text = String(value || "");
  var custom = text.match(/^hg:\/\/detail\/(\d+)\//i);
  var web = text.match(/\/video\/(\d+)\//i);
  var id = custom ? custom[1] : web ? web[1] : "";
  if (!id) return null;
  var coverMatch = text.match(/[?&]cover=([^&#]*)/i);
  var cover = "";
  if (coverMatch) {
    try { cover = decodeURIComponent(coverMatch[1]); } catch (_) { cover = coverMatch[1]; }
  }
  return { id: id, cover: cover };
}

function hgExtractVideoData(html) {
  var match = String(html || "").match(/<script\b[^>]*id=["']videoInitialData["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!match) return null;
  try { return JSON.parse(match[1]); } catch (_) { return null; }
}

function hgEpisodes(data) {
  var tracking = data && data.trackingEpisodes;
  var episodes = tracking && typeof tracking === "object" ? Object.keys(tracking).map(Number).filter((n) => Number.isInteger(n) && n > 0) : [];
  return episodes.sort((a, b) => a - b).slice(0, HUANGGUO_EPISODE_LIMIT);
}

function hgMakeLink(id, poster, episode) {
  var link = "hg://detail/" + id + "/";
  var query = [];
  if (poster) query.push("cover=" + encodeURIComponent(poster));
  if (episode) query.push("ep=" + episode);
  return link + (query.length ? "?" + query.join("&") : "");
}

async function loadDetail(link) {
  var identity = hgParseDetailLink(link);
  if (!identity) return null;
  var url = HUANGGUO_SITE + "/video/" + identity.id + "/";
  var response = await hgGetPage(url, HUANGGUO_SITE + "/");
  if (!response.html || response.status >= 400) return null;
  var data = hgExtractVideoData(response.html);
  var posterSource = identity.cover || (data && (data.posterSrc || data.coverSrc)) || "";
  var worker = await hgWorkerUrl();
  var posterRaw = hgAbsoluteUrl(posterSource);
  if (worker && !(await hgCoverWorkerAvailable(posterRaw, worker))) {
    posterRaw = hgAbsoluteUrl(hgUnwrapCoverWorker(posterRaw, worker));
    worker = "";
  }
  var poster = worker ? hgCoverUrl(posterRaw, worker) : (posterRaw ? (await hgDecryptCover(posterRaw)) || posterRaw : "");
  var titleMatch = response.html.match(/<meta\b[^>]*(?:property|name)=["']og:title["'][^>]*content=["']([^"']+)/i);
  var descriptionMatch = response.html.match(/<meta\b[^>]*(?:property|name)=["']og:description["'][^>]*content=["']([^"']+)/i);
  var title = hgText(titleMatch && titleMatch[1]) || hgText(data && data.title) || "黄果短剧 " + identity.id;
  title = title.replace(/\s*[-|_]\s*(?:黄果短剧|黄果AI|黄果影视).*$/i, "").trim();
  var description = hgText(descriptionMatch && descriptionMatch[1]) || hgText(data && data.description) || title;
  var episodes = hgEpisodes(data);
  var episodeItems = episodes.map((episode) => {
    var episodeLink = hgMakeLink(identity.id, posterRaw, episode);
    var epData = data.trackingEpisodes[String(episode)] || {};
    return {
      id: episodeLink,
      type: "url",
      mediaType: "tv",
      link: episodeLink,
      title: "第 " + episode + " 集",
      episodeNumber: episode,
      duration: Number(epData.drama_duration) || undefined,
      posterPath: poster,
      coverUrl: poster,
    };
  });
  return {
    id: String(link),
    type: "url",
    mediaType: "tv",
    link: String(link),
    title: title,
    description: description,
    releaseDate: data && data.time ? String(data.time).slice(0, 10) : undefined,
    posterPath: poster,
    coverUrl: poster,
    backdropPath: poster,
    episodeItems: episodeItems,
  };
}

function hgResourceIdentity(params) {
  var link = String((params && (params.link || params.id)) || "");
  var detail = hgParseDetailLink(link);
  if (!detail) {
    var web = link.match(/\/video\/(\d+)\/(?:ep-(\d+)\/?)?/i);
    if (web) detail = { id: web[1], cover: "" };
  }
  if (!detail && params) detail = hgParseDetailLink(params.videoLink || params.parentLink);
  if (!detail) return null;
  var epMatch = link.match(/[?&]ep=(\d+)/i);
  var episode = Number((params && (params.episodeNumber || params.ep || params.episode)) || (epMatch && epMatch[1]) || 1);
  if (!Number.isInteger(episode) || episode < 1) episode = 1;
  return { id: detail.id, episode: episode, referer: HUANGGUO_SITE + "/video/" + detail.id + "/" };
}

async function loadResource(params) {
  params = params || {};
  var direct = String(params.videoUrl || params.url || "");
  if (direct && /^https:\/\//i.test(direct)) {
    var directHeaders = {};
    if (params.customHeaders && typeof params.customHeaders === "object") {
      for (var headerName in params.customHeaders) directHeaders[headerName] = String(params.customHeaders[headerName]);
    }
    return [{
      name: params.title || "黄果短剧",
      url: direct,
      playerType: "app",
      customHeaders: Object.keys(directHeaders).length ? directHeaders : undefined,
    }];
  }
  var identity = hgResourceIdentity(params);
  if (!identity) return [];
  var endpoint = HUANGGUO_SITE + "/api/videos/" + identity.id + "/episodes/" + identity.episode + "/playback";
  var commonHeaders = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
    Accept: "application/json",
    "Content-Type": "application/json",
    Origin: HUANGGUO_SITE,
    Referer: identity.referer,
  };
  var response = null;
  var lastError = null;
  for (var attempt = 0; attempt < 2; attempt++) {
    try {
      response = await Widget.http.post(endpoint, "{}", {
        headers: commonHeaders,
        timeout: 10000,
      });
      lastError = null;
      break;
    } catch (error) {
      lastError = error;
      console.warn("黄果播放接口请求失败，重试一次", attempt + 1, error && error.message ? error.message : error);
    }
  }
  if (lastError) return [];
  var status = Number(response && (response.statusCode || response.status)) || 0;
  var envelope = response && response.data;
  if (typeof envelope === "string") {
    try { envelope = JSON.parse(envelope); } catch (_) { return []; }
  }
  if (status >= 400 || !envelope || Number(envelope.status) !== 1) {
    console.warn("黄果播放地址获取失败", status, envelope && envelope.msg ? envelope.msg : "接口返回异常");
    return [];
  }
  var playback = envelope.data || {};
  if (String(playback.id) !== identity.id || Number(playback.ep) !== identity.episode) {
    console.warn("黄果播放接口返回的剧集身份不匹配", identity.id, identity.episode);
    return [];
  }
  if (playback.manifest_method !== "GET" || !playback.streams || typeof playback.streams !== "object") return [];
  var streamCandidates = [];
  var streamNames = ["main", "hevc", "preview"];
  for (var i = 0; i < streamNames.length; i++) {
    var streamUrl = playback.streams[streamNames[i]];
    if (typeof streamUrl === "string" && /^https:\/\//i.test(streamUrl) && streamCandidates.indexOf(streamUrl) < 0) {
      streamCandidates.push(streamUrl);
      if (streamNames[i] === "main") break;
    }
  }
  if (!streamCandidates.length) return [];
  var headers = {};
  var cdn = playback.cdn || {};
  if (cdn.otherEnabled && cdn.authKey && cdn.authValue && cdn.app) {
    headers[cdn.authKey] = cdn.authValue;
    headers["x-cdn-app"] = cdn.app;
  }
  return streamCandidates.map(function (url, index) {
    return {
      name: "第 " + identity.episode + " 集" + (index ? " · 备用" + index : ""),
      description: "HLS 播放资源（播放时实时获取）",
      url: url,
      playerType: "system",
      customHeaders: Object.keys(headers).length ? headers : undefined,
    };
  });
}

if (typeof module !== "undefined" && module && module.exports) {
  module.exports = {
    loadRecommend: loadRecommend,
    loadNewest: loadNewest,
    loadAiDuanju: loadAiDuanju,
    loadAiManju: loadAiManju,
    loadTopics: loadTopics,
    loadRanking: loadRanking,
    searchVideos: searchVideos,
    loadDetail: loadDetail,
    loadResource: loadResource,
    hgParseCards: hgParseCards,
    hgResourceIdentity: hgResourceIdentity,
    hgDecryptCover: hgDecryptCover,
    hgAesCbcDecrypt: hgAesCbcDecrypt,
    hgBase64ToBytes: hgBase64ToBytes,
    hgBytesToBase64: hgBytesToBase64,
  };
}
