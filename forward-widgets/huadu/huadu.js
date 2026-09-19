/*
 * 花都影视（发布页：https://ab.hdfby.com/index.html）Forward / REX 模块
 * 版本：1.0.0（2026-09-19）
 *
 * 数据来源（2026-09-19 实测验证）：
 *   - 列表/分类：GET {line}/index.php/ajax/data?mid=1&tid={1..16}&limit={10|20|30}&page={1..20}
 *     返回 JSON，list[] 为完整 vod 对象；limit 只认 10/20/30，page 上限 20（超出回落 1），
 *     排序固定 vod_time 降序，order/by/hits/sort/ids/wd 参数一律无效。
 *   - 搜索（主）：GET {line}/vodsearch/-------------.html?wd={关键词}&page={n}（40 条/页，可翻页）
 *     注意：关键词必须放在 wd 查询参数，放进路径段会恒为 0 结果。
 *   - 搜索（降级）：GET {line}/index.php/ajax/suggest?mid=1&wd={关键词}&limit={n}
 *     轻量 JSON，但 page 参数无效，且可能出现「已下架死链」——本模块对降级结果做抽样存活校验。
 *   - 详情：GET {line}/index.php/voddetail/{id}.html（SSR，纯文本正则解析，不执行远端脚本）
 *   - 播放：GET {line}/index.php/vodplay/{id}-1-1.html → player_data.url
 *     = base64( percentEncode( m3u8 ) )，两步解码得到最终播放地址。
 *   - 入口：发布页 {publish}/js/config.js（645 B 纯文本，window.line_N = "https://…"）
 *     只做字符串解析，不使用 eval / Function。
 *
 * 网络与安全边界：
 *   - 所有请求目标都先经过 huaduAssertSafeUrl：仅 https、白名单域名族、拒绝凭据 /
 *     IP 字面量 / localhost / 内网与保留名；候选域只能来自发布页发现、缓存或内置清单，
 *     不猜测前缀、不无限枚举。
 *   - 宿主对 timeout / 取消 / 计时器的支持未经证实，本模块不依赖计时器做退避，
 *     改用「同域立即重试 1 次 + 跨域最多 3 个候选 + 失败域冷却」控制最坏耗时。
 *   - 多个线路域共享同一后端（同分页 id 序列一致、同 id 出同一 m3u8），换域是边缘冗余。
 *   - 不存在的 id 返回 HTTP 200 + 约 1 KB 的「系统提示……」占位页，需按内容判定。
 *   - 线路域的 /js/config.js 是 404，线路清单只能从发布页获取，因此必须缓存 + 内置兜底。
 *   - 首页推荐 HTML 各线路域随机且与分页数据不一致，本模块完全不使用它。
 */

WidgetMetadata = {
  id: "forward.huadu.vod",
  title: "花都影视",
  version: "1.0.1",
  requiredVersion: "0.0.1",
  description:
    "花都影视（花都资源）成人内容模块。使用站点自带 JSON 接口提供最新更新、分类浏览、分页、搜索、详情，并解析播放页得到 m3u8 播放资源；带发布入口自动发现、候选域缓存、lastGood 与失败域冷却。",
  author: "Codex",
  site: "https://ab.hdfby.com",
  icon: "https://ab.hdfby.com/favicon.ico",
  detailCacheDuration: 60,
  modules: [
    {
      title: "最新更新",
      description: "按更新时间倒序（站点固定排序，不支持其它排序）",
      requiresWebView: false,
      functionName: "loadLatest",
      cacheDuration: 600,
      params: [
        { name: "page", title: "页码", type: "page", description: "1 - 20", value: "1" },
      ],
    },
    {
      title: "分类浏览",
      description: "一级/二级分类，来自站点导航实测映射",
      requiresWebView: false,
      functionName: "loadCategory",
      cacheDuration: 900,
      params: [
        {
          name: "category",
          title: "分类",
          type: "enumeration",
          description: "分类",
          value: "0",
          enumOptions: [
            { title: "全部", value: "0" },
            { title: "中文字幕", value: "1" },
            { title: "无字幕", value: "2" },
            { title: "国产", value: "3" },
            { title: "欧美", value: "4" },
            { title: "动漫", value: "5" },
            { title: "中字有码", value: "6" },
            { title: "骑兵有码", value: "7" },
            { title: "中字无码", value: "8" },
            { title: "步兵无码", value: "9" },
            { title: "国产精品", value: "10" },
            { title: "国产传媒", value: "11" },
            { title: "欧美中字", value: "12" },
            { title: "糖心Vlog", value: "13" },
            { title: "中字里番", value: "14" },
            { title: "3D动漫", value: "15" },
            { title: "AI短剧", value: "16" },
          ],
        },
        { name: "page", title: "页码", type: "page", description: "1 - 20", value: "1" },
      ],
    },
    {
      id: "loadResource",
      title: "花都影视 播放资源",
      description: "解析播放页 player_data，输出 m3u8",
      functionName: "loadResource",
      type: "stream",
      cacheDuration: 0,
      requiresWebView: false,
      params: [],
    },
  ],
  search: {
    title: "搜索",
    functionName: "search",
    params: [
      { name: "keyword", title: "关键词", type: "input", description: "番号或标题关键词" },
      { name: "page", title: "页码", type: "page", value: "1" },
    ],
  },
};

/* ============================ 常量 ============================ */

// 发布页（三份 /js/config.js 实测字节一致，互为冗余）
var HUADU_PUBLISH_SITES = [
  "https://ab.hdfby.com",
  "https://bb.hdfby.com",
  "https://bb.hdfby.net",
];

// 内置兜底候选（2026-09-19 从发布页 js/config.js 实测采集；仅当发现与缓存都失败时使用）
var HUADU_BUILTIN_ENTRIES = [
  "https://f7.hdys00.com",
  "https://f7.hdys01.com",
  "https://f7.hdys02.com",
  "https://f7.huadudm.com",
  "https://f7.huadudm.net",
  "https://f7.huadudm.org",
  "https://f7.huaduys.com",
  "https://f7.huaduys.net",
  "https://f7.huaduys.vip",
];

// 允许的域名族（发布页自身 + 实测线路域）。收紧白名单优先于「发现什么用什么」。
var HUADU_ALLOWED_SUFFIXES = [
  ".hdfby.com",
  ".hdfby.net",
  ".hdfby.org",
  ".hdys00.com",
  ".hdys01.com",
  ".hdys02.com",
  ".huadudm.com",
  ".huadudm.net",
  ".huadudm.org",
  ".huaduys.com",
  ".huaduys.net",
  ".huaduys.vip",
];

var HUADU_API_MID = 1;
var HUADU_LIST_LIMIT = 20; // 站点白名单只认 10 / 20 / 30
var HUADU_MAX_PAGE = 20; // 实测 page > 20 会被服务端回落成 1
var HUADU_MAX_HOSTS_PER_CALL = 3; // 单次调用最多尝试的候选域数量
var HUADU_ATTEMPTS_PER_HOST = 2; // 同域立即重试次数（无计时器，退避仅靠次数上限）
var HUADU_COOLDOWN_MS = 10 * 60 * 1000; // 失败域冷却
var HUADU_ENTRY_TTL_MS = 6 * 60 * 60 * 1000; // 候选清单刷新周期
var HUADU_TEXT_CACHE_MS = 4 * 60 * 1000; // 会话内页面缓存
var HUADU_SUGGEST_LIMIT = 30;
var HUADU_SUGGEST_VERIFY_LIMIT = 5; // 降级搜索结果抽样存活校验条数

var HUADU_STORAGE_ENTRIES = "huadu.entries.v1";
var HUADU_STORAGE_STATE = "huadu.state.v1";

var HUADU_HEADERS = {
  Accept: "application/json, text/html;q=0.9, */*;q=0.8",
  "Accept-Language": "zh-CN,zh;q=0.9",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
};

var HUADU_CATEGORIES = {
  "1": "中文字幕",
  "2": "无字幕",
  "3": "国产",
  "4": "欧美",
  "5": "动漫",
  "6": "中字有码",
  "7": "骑兵有码",
  "8": "中字无码",
  "9": "步兵无码",
  "10": "国产精品",
  "11": "国产传媒",
  "12": "欧美中字",
  "13": "糖心Vlog",
  "14": "中字里番",
  "15": "3D动漫",
  "16": "AI短剧",
};

// 属性提取用的固定正则（按属性名查表，避免动态构造正则）
var HUADU_ATTR_PATTERNS = {
  href: /\bhref\s*=\s*["']([^"']*)["']/i,
  title: /\btitle\s*=\s*["']([^"']*)["']/i,
  src: /\bsrc\s*=\s*["']([^"']*)["']/i,
  "data-original": /\bdata-original\s*=\s*["']([^"']*)["']/i,
  poster: /\bposter\s*=\s*["']([^"']*)["']/i,
};

/* ============================ 通用工具 ============================ */

function huaduNow() {
  return Date.now();
}

function huaduToInt(value, fallback) {
  var n = parseInt(String(value === undefined || value === null ? "" : value), 10);
  return isNaN(n) ? fallback : n;
}

function huaduClampPage(value) {
  var page = huaduToInt(value, 1);
  if (page < 1) return 1;
  if (page > HUADU_MAX_PAGE) return HUADU_MAX_PAGE;
  return page;
}

function huaduDecodeHtml(value) {
  return String(value === undefined || value === null ? "" : value)
    .replace(/&#x([0-9a-f]+);/gi, function (_, code) {
      return String.fromCharCode(parseInt(code, 16));
    })
    .replace(/&#([0-9]+);/g, function (_, code) {
      return String.fromCharCode(parseInt(code, 10));
    })
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function huaduCleanText(value) {
  return huaduDecodeHtml(
    String(value === undefined || value === null ? "" : value)
      .replace(/<script\b[\s\S]*?<\/script>/gi, "")
      .replace(/<style\b[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim();
}

function huaduFirstMatch(text, pattern, group) {
  var match = String(text === undefined || text === null ? "" : text).match(pattern);
  return match ? huaduDecodeHtml(match[group === undefined ? 1 : group]).trim() : "";
}

function huaduAttribute(tag, name) {
  var pattern = HUADU_ATTR_PATTERNS[String(name || "").toLowerCase()];
  if (!pattern) return "";
  var match = String(tag || "").match(pattern);
  return match ? huaduDecodeHtml(match[1]).trim() : "";
}

function huaduEncoding(value) {
  try {
    return encodeURIComponent(String(value === undefined ? "" : value));
  } catch (error) {
    return String(value === undefined ? "" : value);
  }
}

function huaduError(message, kind) {
  var error = new Error(message);
  error.huaduKind = kind || "error";
  return error;
}

/* ============================ URL 安全校验 ============================ */

// 只允许 https + 白名单域名族；拒绝凭据、IP 字面量、localhost 与内网/保留名。
// 所有网络请求都必须先调用本函数，返回值才是可用的请求地址。
function huaduAssertSafeUrl(url) {
  var text = String(url || "").trim();
  if (!text) throw huaduError("空 URL", "unsafe-url");

  var match = text.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):\/\/([^/?#]+)([\s\S]*)$/);
  if (!match) throw huaduError("URL 结构无法解析", "unsafe-url");

  var scheme = match[1].toLowerCase();
  var authority = match[2];
  var rest = match[3] || "";

  if (scheme !== "https") throw huaduError("只允许 https（收到 " + scheme + "）", "unsafe-url");
  if (authority.indexOf("@") >= 0) throw huaduError("URL 不得包含凭据", "unsafe-url");

  var host = authority.toLowerCase();
  var port = "";
  var colon = host.lastIndexOf(":");
  if (colon > 0 && host.indexOf("]") < 0) {
    port = host.slice(colon + 1);
    host = host.slice(0, colon);
  }
  if (port && port !== "443") throw huaduError("只允许 443 端口", "unsafe-url");

  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(host)) {
    throw huaduError("主机名不合法", "unsafe-url");
  }
  if (host === "localhost" || /\.(localhost|local|internal|home\.arpa|onion)$/.test(host)) {
    throw huaduError("拒绝本机/内网主机", "unsafe-url");
  }
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    throw huaduError("拒绝 IP 字面量主机", "unsafe-url");
  }
  if (!huaduHostAllowedSuffix(host)) {
    throw huaduError("主机不在允许的域名族内：" + host, "unsafe-url");
  }

  return "https://" + authority + rest;
}

function huaduHostAllowedSuffix(host) {
  var lower = String(host || "").toLowerCase();
  for (var i = 0; i < HUADU_ALLOWED_SUFFIXES.length; i++) {
    var suffix = HUADU_ALLOWED_SUFFIXES[i];
    if (lower.length > suffix.length && lower.slice(-suffix.length) === suffix) return true;
  }
  return false;
}

function huaduHostOf(url) {
  var match = String(url || "").match(/^https?:\/\/([^/?#]+)/i);
  if (!match) return "";
  var host = match[1].toLowerCase();
  if (host.indexOf("@") >= 0) host = host.slice(host.lastIndexOf("@") + 1);
  var colon = host.lastIndexOf(":");
  if (colon > 0) host = host.slice(0, colon);
  return host;
}

/* ============================ 编码解码 ============================ */

var HUADU_B64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

// 纯 JS base64 解码（不依赖宿主的 atob 或任何二进制全局对象）
function huaduBase64Decode(input) {
  var text = String(input || "")
    .replace(/[\r\n\t ]/g, "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  while (text.length % 4 !== 0) text += "=";
  var output = "";
  var buffer = 0;
  var bits = 0;
  for (var i = 0; i < text.length; i++) {
    var ch = text.charAt(i);
    if (ch === "=") break;
    var index = HUADU_B64_ALPHABET.indexOf(ch);
    if (index < 0) throw huaduError("播放地址不是合法 base64", "parse");
    buffer = (buffer << 6) | index;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return output;
}

// 百分号解码（不做 + → 空格，保持路径语义）
function huaduDecodePercent(value) {
  var text = String(value || "");
  var output = "";
  for (var i = 0; i < text.length; i++) {
    var ch = text.charAt(i);
    if (ch === "%" && i + 2 < text.length + 1) {
      var hex = text.substr(i + 1, 2);
      if (/^[0-9a-fA-F]{2}$/.test(hex)) {
        output += String.fromCharCode(parseInt(hex, 16));
        i += 2;
        continue;
      }
    }
    output += ch;
  }
  return output;
}

// 播放页 player_data.url：base64 → 百分号解码 → m3u8
function huaduDecodePlayerUrl(value) {
  var raw = String(value || "").trim();
  if (!raw) throw huaduError("播放页没有可用地址", "parse");

  var decoded = "";
  try {
    decoded = huaduDecodePercent(huaduBase64Decode(raw));
  } catch (firstError) {
    // 少数情况下站点直接给出百分号编码（未再套 base64），此时按单层解码处理
    decoded = huaduDecodePercent(raw);
  }
  decoded = decoded.replace(/\\\//g, "/").trim();
  if (!/^https?:\/\//i.test(decoded)) throw huaduError("播放地址解码失败", "parse");
  if (!/m3u8/i.test(decoded)) throw huaduError("播放地址不是 m3u8", "parse");
  return decoded;
}

/* ============================ 存储与状态 ============================ */

var HUADU_MEM_STORAGE = {};
var HUADU_MEM_TEXT_CACHE = {};

async function huaduStorageGet(key) {
  try {
    if (typeof Widget !== "undefined" && Widget.storage && typeof Widget.storage.get === "function") {
      var value = await Widget.storage.get(key);
      if (value !== undefined && value !== null && value !== "") return value;
    }
  } catch (error) {
    console.log("[huadu] 读取存储失败，改用内存缓存：" + (error && error.message ? error.message : ""));
  }
  return HUADU_MEM_STORAGE[key];
}

async function huaduStorageSet(key, value) {
  HUADU_MEM_STORAGE[key] = value;
  try {
    if (typeof Widget !== "undefined" && Widget.storage && typeof Widget.storage.set === "function") {
      await Widget.storage.set(key, value);
    }
  } catch (error) {
    console.log("[huadu] 写入存储失败（已保留内存状态）：" + (error && error.message ? error.message : ""));
  }
}

async function huaduReadJson(key) {
  var text = await huaduStorageGet(key);
  if (!text) return null;
  if (typeof text === "object") return text;
  try {
    return JSON.parse(String(text));
  } catch (error) {
    console.log("[huadu] 缓存损坏，已忽略：" + key);
    return null;
  }
}

async function huaduWriteJson(key, value) {
  try {
    await huaduStorageSet(key, JSON.stringify(value));
  } catch (error) {
    console.log("[huadu] 序列化缓存失败：" + (error && error.message ? error.message : ""));
  }
}

function huaduEmptyState() {
  return { version: 1, lastGood: "", hosts: {} };
}

async function huaduLoadState() {
  var state = await huaduReadJson(HUADU_STORAGE_STATE);
  if (!state || typeof state !== "object" || !state.hosts) return huaduEmptyState();
  if (!state.version) state.version = 1;
  return state;
}

async function huaduSaveState(state) {
  await huaduWriteJson(HUADU_STORAGE_STATE, state);
}

function huaduHostState(state, host) {
  if (!state.hosts[host]) state.hosts[host] = { fail: 0, cooldownUntil: 0, lastOkAt: 0 };
  return state.hosts[host];
}

function huaduHostCooling(state, host, now) {
  var info = state.hosts[host];
  if (!info || !info.cooldownUntil) return false;
  return info.cooldownUntil > now;
}

async function huaduMarkHostSuccess(state, entry) {
  var host = huaduHostOf(entry);
  var info = huaduHostState(state, host);
  info.fail = 0;
  info.cooldownUntil = 0;
  info.lastOkAt = huaduNow();
  state.lastGood = entry;
  await huaduSaveState(state);
}

async function huaduMarkHostFailure(state, entry) {
  var host = huaduHostOf(entry);
  var info = huaduHostState(state, host);
  info.fail = (info.fail || 0) + 1;
  if (info.fail >= 2) {
    info.cooldownUntil = huaduNow() + HUADU_COOLDOWN_MS;
    console.log("[huadu] 线路进入冷却：" + host);
  }
  if (state.lastGood && huaduHostOf(state.lastGood) === host) state.lastGood = "";
  await huaduSaveState(state);
}

/* ============================ 入口发现 ============================ */

// 只做字符串解析：window.line_N = "https://…"
function huaduParseConfigJs(text) {
  var source = String(text || "");
  var results = [];
  var seen = {};
  var marker = "line_";
  var searchFrom = 0;
  while (true) {
    var at = source.indexOf(marker, searchFrom);
    if (at < 0) break;
    searchFrom = at + marker.length;
    var afterName = source.slice(at + marker.length);
    var nameMatch = afterName.match(/^[A-Za-z0-9_]+/);
    if (!nameMatch) continue;
    var tail = afterName.slice(nameMatch[0].length);
    var assign = tail.match(/^\s*=\s*/);
    if (!assign) continue;
    var rest = tail.slice(assign[0].length);
    var quote = rest.charAt(0);
    if (quote !== '"' && quote !== "'") continue;
    var end = rest.indexOf(quote, 1);
    if (end < 0) continue;
    var raw = huaduDecodeHtml(rest.slice(1, end)).trim();
    if (!raw) continue;
    var url = "";
    try {
      url = huaduAssertSafeUrl(raw);
    } catch (error) {
      console.log("[huadu] 忽略发布页中的候选：" + raw + "（" + error.message + "）");
      continue;
    }
    var host = huaduHostOf(url);
    if (!host || seen[host]) continue;
    seen[host] = true;
    results.push(url.replace(/\/index\.html$/i, ""));
  }
  return results;
}

function huaduIsApiEntry(url) {
  var host = huaduHostOf(url);
  if (!host) return false;
  // 发布页（ab./bb.）实测只做静态页，不提供 CMS 接口
  if (host.indexOf("bb.hdfby") === 0 || host.indexOf("ab.hdfby") === 0) return false;
  return true;
}

async function huaduDiscoverEntries(state) {
  var cached = await huaduReadJson(HUADU_STORAGE_ENTRIES);
  var now = huaduNow();

  if (cached && cached.urls && cached.urls.length && now - (cached.fetchedAt || 0) < HUADU_ENTRY_TTL_MS) {
    return { urls: cached.urls, source: "cache", fetchedAt: cached.fetchedAt || 0 };
  }

  var discovered = [];
  var seen = {};
  for (var i = 0; i < HUADU_PUBLISH_SITES.length; i++) {
    var site = HUADU_PUBLISH_SITES[i];
    try {
      var text = await huaduHttpGet(site + "/js/config.js");
      var urls = huaduParseConfigJs(text);
      for (var j = 0; j < urls.length; j++) {
        if (huaduIsApiEntry(urls[j]) && !seen[urls[j]]) {
          seen[urls[j]] = true;
          discovered.push(urls[j]);
        }
      }
      console.log("[huadu] 发布入口发现成功：" + site + "（" + discovered.length + " 条）");
      await huaduMarkHostSuccess(state, site);
      if (discovered.length) break;
    } catch (error) {
      console.log("[huadu] 发布入口不可用：" + site + "（" + error.message + "）");
      await huaduMarkHostFailure(state, site);
    }
  }

  if (discovered.length) {
    await huaduWriteJson(HUADU_STORAGE_ENTRIES, {
      urls: discovered,
      fetchedAt: now,
      source: "publish",
    });
    return { urls: discovered, source: "publish", fetchedAt: now };
  }

  if (cached && cached.urls && cached.urls.length) {
    console.log("[huadu] 发布页不可用，继续使用缓存入口清单");
    return { urls: cached.urls, source: "stale-cache", fetchedAt: cached.fetchedAt || 0 };
  }

  console.log("[huadu] 发布页与缓存都不可用，使用内置候选域");
  return { urls: HUADU_BUILTIN_ENTRIES.slice(0), source: "builtin", fetchedAt: 0 };
}

// 候选顺序：lastGood 优先，冷却中的域排到最后
async function huaduCandidateEntries(state) {
  var entries = await huaduDiscoverEntries(state);
  var urls = entries.urls.slice(0);
  var now = huaduNow();
  var lastGood = state.lastGood || "";

  var primary = [];
  var normal = [];
  var cooling = [];
  for (var i = 0; i < urls.length; i++) {
    var url = urls[i];
    if (lastGood && url === lastGood) {
      primary.push(url);
    } else if (huaduHostCooling(state, huaduHostOf(url), now)) {
      cooling.push(url);
    } else {
      normal.push(url);
    }
  }
  return { entries: primary.concat(normal).concat(cooling), source: entries.source, lastGood: lastGood };
}

/* ============================ 网络请求 ============================ */

function huaduClassifyStatus(status) {
  var code = huaduToInt(status, 0);
  if (code === 403) return "waf";
  if (code === 404) return "not-found";
  if (code === 429) return "rate-limit";
  if (code >= 500) return "server";
  if (code >= 400) return "client";
  if (code === 0) return "network";
  return "ok";
}

// 唯一的 HTTP 出口：先校验目标地址，再发请求。
async function huaduHttpGet(target, options) {
  var safeUrl = huaduAssertSafeUrl(target); // 仅 https + 白名单域名族
  var headers = {};
  for (var key in HUADU_HEADERS) headers[key] = HUADU_HEADERS[key];
  var authorityEnd = safeUrl.indexOf("/", 8);
  headers.Referer = authorityEnd > 0 ? safeUrl.slice(0, authorityEnd + 1) : safeUrl;
  if (options && options.fresh) headers["Cache-Control"] = "no-cache";

  var response = null;
  try {
    response = await Widget.http.get(safeUrl, { headers: headers });
  } catch (error) {
    throw huaduError("网络请求失败：" + (error && error.message ? error.message : "未知错误"), "network");
  }

  var status = response && response.statusCode !== undefined ? response.statusCode : 200;
  var kind = huaduClassifyStatus(status);

  if (kind === "waf") throw huaduError("被站点边缘拦截（403）", "waf");
  if (kind === "rate-limit") throw huaduError("请求过于频繁（429）", "rate-limit");
  if (kind === "server") throw huaduError("站点服务端错误（" + status + "）", "server");
  if (kind === "not-found") throw huaduError("接口或页面不存在（404）", "not-found");
  if (kind !== "ok") throw huaduError("请求失败（" + status + "）", kind);

  var data = response ? response.data : "";
  if (data === undefined || data === null || data === "") throw huaduError("响应为空", "empty");
  return data;
}

function huaduRetryable(kind) {
  return (
    kind === "network" ||
    kind === "server" ||
    kind === "rate-limit" ||
    kind === "waf" ||
    kind === "empty"
  );
}

async function huaduFetchText(path, options) {
  var opts = options || {};
  var fresh = !!opts.fresh;
  var key = String(path || "");
  var now = huaduNow();
  var cached = HUADU_MEM_TEXT_CACHE[key];
  if (!fresh && cached && cached.expires > now) return cached.text;

  var state = await huaduLoadState();
  var candidates = await huaduCandidateEntries(state);
  var list = candidates.entries;
  if (!list.length) throw huaduError("没有可用线路", "no-entry");

  var limit = Math.min(HUADU_MAX_HOSTS_PER_CALL, list.length);
  var lastError = null;
  var tried = 0;

  for (var i = 0; i < list.length && tried < limit; i++) {
    var entry = list[i];
    var host = huaduHostOf(entry);
    if (huaduHostCooling(state, host, now)) continue;
    tried++;

    for (var attempt = 0; attempt < HUADU_ATTEMPTS_PER_HOST; attempt++) {
      try {
        var text = await huaduHttpGet(entry + key, opts);
        if (typeof text !== "string" || !text) throw huaduError("响应内容为空", "empty");
        await huaduMarkHostSuccess(state, entry);
        if (!fresh) HUADU_MEM_TEXT_CACHE[key] = { text: text, expires: now + HUADU_TEXT_CACHE_MS };
        return text;
      } catch (error) {
        lastError = error;
        var kind = error && error.huaduKind ? error.huaduKind : "network";
        console.log("[huadu] 页面读取失败（" + host + "）：" + error.message);
        if (kind === "not-found" || !huaduRetryable(kind)) {
          await huaduMarkHostFailure(state, entry);
          throw error;
        }
        if (attempt + 1 >= HUADU_ATTEMPTS_PER_HOST) await huaduMarkHostFailure(state, entry);
      }
    }
  }

  throw huaduError("所有候选线路都失败：" + (lastError ? lastError.message : "未知"), "network");
}

async function huaduFetchJson(path, options) {
  var text = await huaduFetchText(path, options);
  try {
    return JSON.parse(text);
  } catch (error) {
    // 兼容宿主已经把 JSON 解析成对象、返回字符串化结果的情况
    throw huaduError("响应不是合法 JSON（可能被拦截或站点已改版）", "parse");
  }
}

/* ============================ 解析 ============================ */

// 占位页（不存在的 id）：HTTP 200 + 约 1 KB「系统提示……」
function huaduIsPlaceholderPage(html) {
  var text = String(html || "");
  if (!text) return true;
  if (text.length < 3000) {
    if (text.indexOf("系统提示") >= 0) return true;
    if (!/player_data|voddetail|vod_play|stui-vodlist/.test(text)) return true;
  }
  return false;
}

function huaduCategoryName(typeId) {
  var key = String(typeId || "");
  return HUADU_CATEGORIES[key] || "";
}

function huaduCategoryIdByName(name) {
  var target = String(name || "").trim();
  for (var key in HUADU_CATEGORIES) {
    if (HUADU_CATEGORIES[key] === target) return key;
  }
  return "";
}

function huaduParseDurationSeconds(text) {
  var match = String(text || "").trim().match(/^(\d{1,3}):(\d{2}):(\d{2})$/);
  if (!match) return 0;
  return huaduToInt(match[1], 0) * 3600 + huaduToInt(match[2], 0) * 60 + huaduToInt(match[3], 0);
}

function huaduVideoItem(vod) {
  if (!vod || !vod.vod_id) return null;
  var id = String(vod.vod_id);
  var name = huaduCleanText(vod.vod_name) || "花都影视 #" + id;
  var sub = huaduCleanText(vod.vod_sub);
  var code = huaduCleanText(vod.vod_en);
  var tag = huaduCleanText(vod.vod_tag);
  var actor = huaduCleanText(vod.vod_actor);
  var picture = String(vod.vod_pic || "").trim();
  if (picture && /\/no\.jpg$/i.test(picture)) picture = "";

  var typeId = vod.type_id ? String(vod.type_id) : "";
  var typeName = "";
  if (vod.type && vod.type.type_name) typeName = huaduCleanText(vod.type.type_name);
  if (!typeName) typeName = huaduCategoryName(typeId);

  var durationText = huaduCleanText(vod.vod_duration);
  var rating = Number(vod.vod_score);
  var item = {
    id: "huadu:" + id,
    type: "url",
    mediaType: "movie",
    title: name,
    link: "huadu://vod/" + id,
    description: sub || tag || actor || "",
    coverUrl: picture,
    posterPath: picture,
    backdropPath: picture,
    releaseDate: huaduCleanText(vod.vod_time).slice(0, 10),
    rating: isNaN(rating) ? 0 : rating,
    durationText: durationText,
    duration: huaduParseDurationSeconds(durationText),
  };
  if (typeName) {
    item.genreTitle = typeName;
    item.genreItems = [{ id: typeId || typeName, title: typeName }];
  }
  if (code) item.originalTitle = code;
  return item;
}

function huaduParseJsonList(payload) {
  if (!payload || typeof payload !== "object") throw huaduError("列表响应格式异常", "parse");
  if (huaduToInt(payload.code, 1) !== 1) throw huaduError("列表接口返回错误码", "parse");
  var list = payload.list || [];
  var items = [];
  for (var i = 0; i < list.length; i++) {
    var item = huaduVideoItem(list[i]);
    if (item) items.push(item);
  }
  return {
    items: items,
    page: huaduToInt(payload.page, 1),
    pageCount: huaduToInt(payload.pagecount, 0),
    total: huaduToInt(payload.total, 0),
  };
}

function huaduExtractId(value) {
  var text = String(value === undefined || value === null ? "" : value).trim();
  if (!text) return "";
  if (text.indexOf("huadu:") === 0) {
    // 兼容 "huadu:27916" 与 "huadu://vod/27916" 两种写法
    var digits = text.match(/(\d{1,12})$/);
    return digits ? digits[1] : "";
  }
  var fromRoute = text.match(/(?:voddetail|vodplay)\/(\d+)/);
  if (fromRoute) return fromRoute[1];
  var bare = text.match(/^(\d{1,12})$/);
  if (bare) return bare[1];
  return "";
}

// 通用卡片解析：搜索页 / 分类页 / 详情页的「猜你喜欢」
function huaduParseCards(html) {
  var source = huaduDecodeHtml(String(html || ""));
  var results = [];
  var seen = {};
  var marker = "stui-vodlist__thumb";
  var searchFrom = 0;

  while (true) {
    var at = source.indexOf(marker, searchFrom);
    if (at < 0) break;
    searchFrom = at + marker.length;

    var anchorStart = source.lastIndexOf("<a", at);
    var anchorEnd = source.indexOf(">", at);
    if (anchorStart < 0 || anchorEnd < 0) continue;

    var tag = source.slice(anchorStart, anchorEnd + 1);
    var id = huaduExtractId(huaduAttribute(tag, "href"));
    if (!id || seen[id]) continue;
    seen[id] = true;

    var block = source.slice(anchorStart, anchorStart + 1200);
    var image = huaduAttribute(block, "data-original") || huaduAttribute(block, "src");
    if (image && /\/no\.jpg$/i.test(image)) image = "";

    var remarks = huaduCleanText(
      huaduFirstMatch(block, /<span\b[^>]*class=["'][^"']*pic-text[^"']*["'][^>]*>([\s\S]*?)<\/span>/i)
    );
    var item = {
      id: "huadu:" + id,
      type: "url",
      mediaType: "movie",
      title: huaduCleanText(huaduAttribute(tag, "title")) || "花都影视 #" + id,
      link: "huadu://vod/" + id,
      coverUrl: image,
      posterPath: image,
      backdropPath: image,
    };
    if (remarks) item.description = remarks;
    results.push(item);
  }
  return results;
}

function huaduSearchResultCount(html) {
  // 页面里计数写作「相关的&nbsp;<strong>N</strong>」，先解实体再匹配
  var decoded = huaduDecodeHtml(String(html || ""));
  var count = huaduFirstMatch(decoded, /相关的\s*<strong[^>]*>(\d+)<\/strong>/, 1);
  return huaduToInt(count, -1);
}

function huaduParseDetail(html, id) {
  var source = huaduDecodeHtml(String(html || ""));
  var title = huaduCleanText(huaduFirstMatch(source, /<title>([\s\S]*?)<\/title>/i));
  var book = title.match(/《([^》]{1,120})》/);
  if (book) title = book[1];
  title = title.replace(/详情介绍[\s\S]*$/, "").trim();

  var poster = huaduFirstMatch(
    source,
    /<img\b[^>]*class=["'][^"']*lazyload[^"']*["'][^>]*\bdata-original=["']([^"']+)["']/i
  );
  if (!poster) poster = huaduFirstMatch(source, /\bdata-original=["']([^"']+)["']/i);
  if (poster && /\/no\.jpg$/i.test(poster)) poster = "";

  // 详情页 meta 行固定为「<strong>标签：</strong>值</p>」，用固定正则逐项取
  var category = huaduCleanText(
    huaduFirstMatch(source, /<strong[^>]*>分类：\s*<\/strong>\s*([\s\S]{0,200}?)<\/p>/i)
  );
  var date = huaduCleanText(
    huaduFirstMatch(source, /<strong[^>]*>日期：\s*<\/strong>\s*([\s\S]{0,200}?)<\/p>/i)
  );
  var durationText = huaduCleanText(
    huaduFirstMatch(source, /<strong[^>]*>时长：\s*<\/strong>\s*([\s\S]{0,200}?)<\/p>/i)
  );
  var actor = huaduCleanText(
    huaduFirstMatch(source, /<strong[^>]*>演员：\s*<\/strong>\s*([\s\S]{0,200}?)<\/p>/i)
  );

  var tags = [];
  var tagMarker = "vodsearch/";
  var tagFrom = 0;
  while (true) {
    var tagAt = source.indexOf(tagMarker, tagFrom);
    if (tagAt < 0) break;
    tagFrom = tagAt + tagMarker.length;
    var anchorStart = source.lastIndexOf("<a", tagAt);
    var anchorEnd = source.indexOf(">", tagAt);
    if (anchorStart < 0 || anchorEnd < 0) continue;
    var tagText = source.slice(anchorEnd + 1);
    var close = tagText.indexOf("</a>");
    if (close < 0) continue;
    var name = huaduCleanText(tagText.slice(0, close));
    if (!name || name === category || name === actor) continue;
    if (tags.indexOf(name) >= 0) continue;
    tags.push(name);
    if (tags.length >= 12) break;
  }

  var description = [];
  if (tags.length) description.push(tags.join(" / "));
  if (actor) description.push("演员：" + actor);

  var playPath = huaduFirstMatch(source, /\/?(?:index\.php\/)?vodplay\/(\d+-\d+-\d+)\.html/i, 1);
  var related = huaduParseCards(source).filter(function (card) {
    return huaduExtractId(card.id) !== String(id);
  });

  var item = {
    id: "huadu:" + id,
    type: "url",
    mediaType: "movie",
    title: title || "花都影视 #" + id,
    link: "huadu://vod/" + id,
    description: description.join("\n"),
    coverUrl: poster,
    posterPath: poster,
    detailPoster: poster,
    backdropPath: poster,
    backdropPaths: poster ? [poster] : [],
    releaseDate: date,
    durationText: durationText,
    duration: huaduParseDurationSeconds(durationText),
    relatedItems: related.slice(0, 8),
  };
  if (category) {
    item.genreTitle = category;
    item.genreItems = [{ id: huaduCategoryIdByName(category) || category, title: category }];
  }
  if (playPath) item.playPath = playPath;
  return item;
}

function huaduParsePlayerData(html) {
  var source = String(html || "");
  var block = source.match(/var\s+player_data\s*=\s*(\{[\s\S]*?\})\s*<\/script>/i);
  var json = block ? block[1] : "";
  if (!json) {
    var loose = source.match(/player_data\s*=\s*(\{[\s\S]{0,2000}?"url"\s*:\s*"[^"]+"[\s\S]{0,400}?\})/i);
    json = loose ? loose[1] : "";
  }
  if (!json) return null;
  var url = huaduFirstMatch(json, /"url"\s*:\s*"([^"]*)"/, 1);
  if (!url) return null;
  return {
    url: url,
    from: huaduFirstMatch(json, /"from"\s*:\s*"([^"]*)"/, 1),
    sid: huaduToInt(huaduFirstMatch(json, /"sid"\s*:\s*(\d+)/, 1), 1),
    nid: huaduToInt(huaduFirstMatch(json, /"nid"\s*:\s*(\d+)/, 1), 1),
  };
}

/* ============================ 路径构造 ============================ */

function huaduListPath(typeId, page) {
  var tid = huaduToInt(typeId, 0);
  var safePage = huaduClampPage(page);
  return (
    "/index.php/ajax/data?mid=" +
    HUADU_API_MID +
    "&tid=" +
    (tid > 0 ? tid : "") +
    "&limit=" +
    HUADU_LIST_LIMIT +
    "&page=" +
    safePage
  );
}

function huaduDetailPath(id) {
  return "/index.php/voddetail/" + huaduExtractId(id) + ".html";
}

function huaduPlayPath(id, sid, nid) {
  return (
    "/index.php/vodplay/" +
    huaduExtractId(id) +
    "-" +
    (huaduToInt(sid, 1) || 1) +
    "-" +
    (huaduToInt(nid, 1) || 1) +
    ".html"
  );
}

function huaduSearchPath(keyword, page) {
  return "/vodsearch/-------------.html?wd=" + huaduEncoding(keyword) + "&page=" + huaduClampPage(page);
}

function huaduSuggestPath(keyword) {
  return (
    "/index.php/ajax/suggest?mid=" +
    HUADU_API_MID +
    "&wd=" +
    huaduEncoding(keyword) +
    "&limit=" +
    HUADU_SUGGEST_LIMIT
  );
}

/* ============================ 模块函数 ============================ */

async function huaduFetchList(typeId, page) {
  var requested = huaduClampPage(page);
  var parsed = huaduParseJsonList(await huaduFetchJson(huaduListPath(typeId, requested)));
  if (parsed.items.length && parsed.page !== requested) {
    console.log("[huadu] 服务端返回页码与请求不一致（请求 " + requested + "，返回 " + parsed.page + "）");
  }
  return parsed;
}

async function loadLatest(params) {
  params = params || {};
  var typeId = huaduToInt(params.genreId || params.category || 0, 0);
  var result = await huaduFetchList(typeId, params.page);
  return result.items;
}

async function loadCategory(params) {
  params = params || {};
  var typeId = huaduToInt(params.genreId || params.category || 0, 0);
  var result = await huaduFetchList(typeId, params.page);
  return result.items;
}

async function search(params) {
  params = params || {};
  var keyword = String(params.keyword || params.query || "").trim();
  if (!keyword) return [];
  var page = huaduClampPage(params.page);

  try {
    var html = await huaduFetchText(huaduSearchPath(keyword, page));
    var items = huaduParseCards(html);
    var count = huaduSearchResultCount(html);
    // 计数标记与结果卡片都拿不到，才判定为页面结构异常（真实空结果会返回空数组）
    if (count < 0 && !items.length) throw huaduError("搜索页结构异常", "parse");
    console.log(
      "[huadu] 搜索「" + keyword + "」第 " + page + " 页，声明 " + count + " 条，解析 " + items.length + " 条"
    );
    return items;
  } catch (error) {
    console.log("[huadu] 搜索页不可用，降级到 suggest：" + error.message);
  }

  // 降级：suggest JSON（可能包含已下架死链，抽样做存活校验）
  var payload = await huaduFetchJson(huaduSuggestPath(keyword));
  var list = payload && payload.list ? payload.list : [];
  var candidates = [];
  for (var i = 0; i < list.length; i++) {
    var entry = list[i];
    if (!entry || !entry.id) continue;
    var picture = String(entry.pic || "").trim();
    if (picture && /\/no\.jpg$/i.test(picture)) picture = "";
    candidates.push({
      id: "huadu:" + entry.id,
      type: "url",
      mediaType: "movie",
      title: huaduCleanText(entry.name) || "花都影视 #" + entry.id,
      link: "huadu://vod/" + entry.id,
      description: huaduCleanText(entry.en),
      coverUrl: picture,
      posterPath: picture,
    });
  }

  var verified = [];
  var checked = 0;
  var dead = 0;
  for (var j = 0; j < candidates.length && checked < HUADU_SUGGEST_VERIFY_LIMIT; j++) {
    checked++;
    try {
      var detailHtml = await huaduFetchText(huaduDetailPath(candidates[j].id));
      if (huaduIsPlaceholderPage(detailHtml)) {
        dead++;
        console.log("[huadu] 忽略已下架条目：" + candidates[j].id);
        continue;
      }
      verified.push(candidates[j]);
    } catch (checkError) {
      verified.push(candidates[j]);
    }
  }

  if (checked > 0 && dead === checked) throw huaduError("搜索源返回的条目均已失效", "stale");
  return verified.concat(candidates.slice(checked));
}

async function loadDetail(link) {
  var id = huaduExtractId(link);
  if (!id) return null;

  var html = null;
  try {
    html = await huaduFetchText(huaduDetailPath(id));
  } catch (error) {
    if (error && error.huaduKind === "not-found") return null;
    throw error;
  }
  if (huaduIsPlaceholderPage(html)) {
    console.log("[huadu] 详情不存在或已下架：" + id);
    return null;
  }
  return huaduParseDetail(html, id);
}

async function loadResource(params) {
  params = params || {};

  if (params.videoUrl || params.url) {
    return [
      {
        name: "花都影视",
        description: "直接播放地址",
        url: huaduAssertSafeUrl(String(params.videoUrl || params.url)),
      },
    ];
  }

  var id = huaduExtractId(params.link) || huaduExtractId(params.id) || huaduExtractId(params.episode);
  if (!id) return [];

  var sid = huaduToInt(params.sid, 1) || 1;
  var nid = huaduToInt(params.nid, 1) || 1;
  var html = await huaduFetchText(huaduPlayPath(id, sid, nid), { fresh: true });
  if (huaduIsPlaceholderPage(html)) {
    console.log("[huadu] 播放页不存在：" + id);
    return [];
  }

  var player = huaduParsePlayerData(html);
  if (!player || !player.url) {
    // 兜底：从详情页取最新的播放路径（多线路或页面结构变化时）
    var detailHtml = await huaduFetchText(huaduDetailPath(id), { fresh: true });
    if (huaduIsPlaceholderPage(detailHtml)) return [];
    var playPath = huaduFirstMatch(detailHtml, /\/?(?:index\.php\/)?vodplay\/(\d+-\d+-\d+)\.html/i, 1);
    if (playPath) {
      var parts = playPath.split("-");
      html = await huaduFetchText(huaduPlayPath(parts[0], parts[1], parts[2]), { fresh: true });
      player = huaduParsePlayerData(html);
    }
  }
  if (!player || !player.url) throw huaduError("播放页未找到可用地址", "parse");

  var mediaUrl = huaduDecodePlayerUrl(player.url);
  console.log("[huadu] 播放地址解析成功：" + mediaUrl.slice(0, 40) + "…");
  return [
    {
      name: "花都影视" + (player.from ? " · " + player.from : ""),
      description: "HLS（m3u8）",
      url: mediaUrl,
    },
  ];
}

/* ============================ 可选导出（仅离线测试用） ============================ */

// 宿主里没有 module，这段不会执行；离线夹具用它按名字取用模块函数。
// 注意：脚本加载期只有「常量初始化 + WidgetMetadata 赋值」，不向宿主全局写任何东西，
// 避免宿主沙箱禁止写全局时整脚本加载失败。
if (typeof module !== "undefined" && module && module.exports) {
  try {
    module.exports = {
      loadLatest: loadLatest,
      loadCategory: loadCategory,
      search: search,
      loadDetail: loadDetail,
      loadResource: loadResource,
      huaduAssertSafeUrl: huaduAssertSafeUrl,
      huaduParseConfigJs: huaduParseConfigJs,
      huaduExtractId: huaduExtractId,
      huaduDecodePlayerUrl: huaduDecodePlayerUrl,
      huaduIsPlaceholderPage: huaduIsPlaceholderPage,
      huaduParseCards: huaduParseCards,
    };
  } catch (error) {
    // 某些沙箱可能禁止导出，忽略即可
  }
}
