/**
 * 喜马拉雅极速版 · 每日任务 / 看广告领畅听时长
 *
 * 上游参考：
 *   https://github.com/Zero-S1/xmly_speed （接口与 RSA 签名方案）
 *   https://github.com/chavyleung/scripts （Loon/Surge 脚本范式）
 *
 * 用法：
 *   1. Loon 导入插件，保持「Cookie 抓取」开启并打开 MITM。
 *   2. 打开喜马拉雅极速版，进入「福利」页随便点一下。
 *   3. 收到「Cookie 抓取成功」后即可关闭抓取开关，之后每天定时自动跑。
 */

const NAME = "喜马拉雅极速版";
const KEY_COOKIE = "xmly_speed_cookie";
const KEY_LAST = "xmly_speed_last_result";
const KEY_ACTIVITY_REQUEST = "xmly_speed_activity_request";

const UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 iting/2.0.9 kdtunion_iting/1.0 iting(main)/2.0.9/ios_1";

const PUBKEY_N =
  "9585a4773abeecb949701d49762f2dfab9599ba19dfe1e1a2fa200e32e0444f426da528912d9ea8669515f6f1014c454e1343b97abf7c10fe49d520a6999c66b230e0730c3f802d136a892501ff2b13d699b5c7ecbbfef428ac36d3d83a5bd627f18746a7fdc774c12a38de2760a3b95c653c10d7eb7f84722976251f649556b";
const PUBKEY_E = "010001";

const isRequest = typeof $request !== "undefined";

!(async () => {
  if (typeof $response !== "undefined") {
    captureActivityResponse();
    return;
  }
  if (isRequest) {
    captureCookie();
    captureActivityRequest();
    return;
  }
  await runTasks();
})()
  .catch((e) => {
    const msg = e && e.message ? e.message : String(e);
    console.log(`[${NAME}] 异常: ${msg}`);
    $notification.post(NAME, "运行异常", msg);
  })
  .finally(() => $done());

/* ---------------------------- Cookie 抓取 ---------------------------- */

function captureCookie() {
  const headers = $request.headers || {};
  const cookie = headers.Cookie || headers.cookie || "";
  if (!cookie || cookie.indexOf("1&_token") === -1) return;

  const stored = $persistentStore.read(KEY_COOKIE);
  if (stored === cookie) return;

  $persistentStore.write(cookie, KEY_COOKIE);
  $notification.post(NAME, "Cookie 抓取成功", "已保存登录态，可以关闭抓取开关");
  console.log(`[${NAME}] Cookie 已更新`);
}

function isActivityUrl(url) {
  return /^https?:\/\/(?:m|mobile)\.ximalaya\.com\/(?:lite-earn\/|speed\/(?:web-earn|task-center)\/|pizza-category\/activity\/)/i.test(
    String(url || "")
  );
}

function safeUrl(url) {
  const text = String(url || "").split("#")[0];
  const at = text.indexOf("?");
  if (at < 0) return text;
  const base = text.slice(0, at);
  const query = text
    .slice(at + 1)
    .split("&")
    .map((part) => {
      const eq = part.indexOf("=");
      const key = eq < 0 ? part : part.slice(0, eq);
      let decodedKey = key;
      try {
        decodedKey = decodeURIComponent(key.replace(/\+/g, " "));
      } catch (e) {}
      return /token|sign|uid|user.?id|device|phone|mobile|session|account|cookie|auth/i.test(decodedKey)
        ? `${key}=<redacted>`
        : part;
    })
    .join("&");
  return `${base}?${query}`;
}

function redact(value, key) {
  if (/(cookie|token|sign|authorization|uid|user.?id|device|phone|mobile|session|account)/i.test(key || "")) {
    return "<redacted>";
  }
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => redact(item, ""));
  if (value && typeof value === "object") {
    const out = {};
    Object.keys(value).slice(0, 80).forEach((k) => {
      out[k] = redact(value[k], k);
    });
    return out;
  }
  if (typeof value === "string") return value.slice(0, 300);
  return value;
}

function parseBody(text) {
  try {
    return redact(JSON.parse(String(text || "")), "");
  } catch (e) {
    return text ? "<non-JSON body omitted>" : "";
  }
}

function captureActivityRequest() {
  if (!isActivityUrl($request.url)) return;
  const record = {
    phase: "request",
    method: String($request.method || "GET").toUpperCase(),
    url: safeUrl($request.url),
    body: parseBody($request.body || ""),
    capturedAt: Date.now(),
  };
  const pending = readActivityRequests();
  pending[record.url] = record;
  const keys = Object.keys(pending);
  while (keys.length > 30) delete pending[keys.shift()];
  $persistentStore.write(JSON.stringify(pending), KEY_ACTIVITY_REQUEST);
  console.log(`[${NAME}] 活动请求诊断 ${JSON.stringify(record)}`);
}

function captureActivityResponse() {
  const url = $request && $request.url;
  if (!isActivityUrl(url)) return;
  const responseUrl = safeUrl(url);
  const pending = readActivityRequests();
  const req = pending[responseUrl] || {};
  delete pending[responseUrl];
  $persistentStore.write(JSON.stringify(pending), KEY_ACTIVITY_REQUEST);
  const record = {
    phase: "response",
    method: String(($request && $request.method) || req.method || "GET").toUpperCase(),
    url: responseUrl,
    status: Number(($response && ($response.status || $response.statusCode)) || 0),
    requestBody: req.body,
    responseBody: parseBody(($response && $response.body) || ""),
    capturedAt: Date.now(),
  };
  console.log(`[${NAME}] 活动响应诊断 ${JSON.stringify(record)}`);
}

function readActivityRequests() {
  try {
    const value = JSON.parse($persistentStore.read(KEY_ACTIVITY_REQUEST) || "{}");
    return value && typeof value === "object" ? value : {};
  } catch (e) {
    return {};
  }
}

/* ---------------------------- 任务调度 ---------------------------- */

function cookieMap(cookie) {
  const map = {};
  String(cookie || "")
    .split(";")
    .forEach((part) => {
      const at = part.indexOf("=");
      if (at <= 0) return;
      map[part.slice(0, at).trim()] = part.slice(at + 1).trim();
    });
  return map;
}

function uidOf(cookie) {
  const token = cookieMap(cookie)["1&_token"] || "";
  return token.split("&")[0] || "";
}

function beijingDate() {
  const now = new Date();
  const bj = new Date(now.getTime() + (8 * 60 + now.getTimezoneOffset()) * 60000);
  const mm = String(bj.getMonth() + 1).padStart(2, "0");
  const dd = String(bj.getDate()).padStart(2, "0");
  return `${bj.getFullYear()}${mm}${dd}`;
}

function arg(key, fallback) {
  if (typeof $argument === "object" && $argument !== null && $argument[key] !== undefined) {
    return String($argument[key]);
  }
  return fallback;
}

function isOn(key) {
  const v = arg(key, "true").toLowerCase();
  return v !== "false" && v !== "0" && v !== "off";
}

async function runTasks() {
  const cookie = $persistentStore.read(KEY_COOKIE);
  if (!cookie) {
    $notification.post(NAME, "未找到 Cookie", "请先开启抓取开关，打开喜马拉雅极速版福利页");
    return;
  }

  const uid = uidOf(cookie);
  if (!uid) {
    $notification.post(NAME, "Cookie 无效", "缺少 1&_token，请重新抓取");
    return;
  }

  const lines = [];
  lines.push("注意：截图中的“看广告免费听 VIP 领时长”尚未执行；旧版气泡广告任务不等于此活动");
  const tasks = [
    ["签到", isOn("task_checkin"), () => checkin(cookie, uid)],
    ["阶段奖励", isOn("task_stage"), () => stageRewards(cookie)],
    ["旧版收听气泡广告奖励", isOn("task_ad_listen"), () => adListen(cookie, uid)],
    ["宝箱奖励", isOn("task_box"), () => boxAward(cookie, uid)],
  ];

  for (const [label, enabled, run] of tasks) {
    if (!enabled) continue;
    try {
      const tip = await run();
      lines.push(`${label}：${tip || "完成"}`);
    } catch (e) {
      lines.push(`${label}：失败 ${e && e.message ? e.message : e}`);
    }
  }

  try {
    const coin = await wallet(cookie);
    if (coin) lines.push(`金币：今日 ${coin.today} / 累计 ${coin.history}`);
  } catch (e) {
    /* 汇总失败不影响任务结果 */
  }

  const body = lines.join("\n") || "没有启用任何任务";
  $persistentStore.write(body, KEY_LAST);
  $notification.post(NAME, "每日任务运行结束", body);
  console.log(`[${NAME}]\n${body}`);
}

/* ---------------------------- 具体任务 ---------------------------- */

function headersFor(cookie, referer) {
  const h = {
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "zh-cn",
    "User-Agent": UA,
    Cookie: cookie,
  };
  if (referer) h.Referer = referer;
  return h;
}

async function checkin(cookie, uid) {
  const base = "https://m.ximalaya.com/speed/task-center/check-in";
  const info = await api(cookie, `${base}/record`);
  if (info && info.isTickedToday) return `今日已签到，连续 ${info.continuousDays || 0} 天`;

  const checkData = rsaEncryptPKCS1(`date=${beijingDate()}&uid=${uid}`, PUBKEY_N, PUBKEY_E);
  const res = await api(cookie, `${base}/check`, {
    method: "POST",
    body: { checkData, makeUp: false },
  });
  if (res && res.errorCode !== undefined) return `失败（${res.errorCode}）`;
  if (res && res.ret !== undefined && res.ret !== 0) return `失败（ret=${res.ret}）`;
  if (res && res.continuousDays) return `成功，连续 ${res.continuousDays} 天`;
  return "成功";
}

async function stageRewards(cookie) {
  const base = "https://m.ximalaya.com/speed/web-earn/task";
  const res = await api(cookie, `${base}/stage-rewards-daily`);
  const data = res && res.data;
  const stages = (data && data.stageRewards) || [];
  let got = 0;

  for (let i = 0; i < stages.length; i++) {
    if (stages[i].status !== 1) continue;
    const result = await api(cookie, `${base}/stage-reward/receive?stage=${i + 1}`);
    if (requestSucceeded(result)) got += 1;
    await sleep(1200);
  }
  return got ? `领取 ${got} 档` : "暂无可领取";
}

async function adListen(cookie, uid) {
  const token = await adToken(cookie);
  if (!token) return "获取广告令牌失败";

  const body = {
    listenTime: Number(arg("bubble_listen_time", "41246")),
    signature: arg("bubble_signature", "2b1cc9e8831cff8874d9c"),
    currentTimeMillis: String(Date.now()),
    uid,
    expire: false,
  };
  const res = await api(cookie, "https://m.ximalaya.com/speed/web-earn/listen/bubbles", {
    method: "POST",
    body,
    referer: "https://m.ximalaya.com/xmds-node-spa/apps/speed-growth-open-components/bubble",
  });
  const data = (res && res.data) || {};
  const live = data.effectiveBubbles || [];
  const expired = data.expiredBubbles || [];
  if (!live.length && !expired.length) return "暂无气泡（需先在 App 内听书一段时间）";

  let claimed = 0;
  let adGranted = 0;
  for (const item of live) {
    const got = await api(cookie, `https://m.ximalaya.com/speed/web-earn/listen/receive/${item.id}`, {
      referer: "https://m.ximalaya.com/xmds-node-spa/apps/speed-growth-open-components/bubble",
    });
    if (requestSucceeded(got)) {
      claimed += 1;
      const score = await adScore(cookie, uid, 7, item.id);
      if (requestSucceeded(score)) adGranted += 1;
    }
    await sleep(1500);
  }
  for (const item of expired) {
    const score = await adScore(cookie, uid, 6, item.id);
    if (requestSucceeded(score)) adGranted += 1;
    await sleep(1500);
  }
  if (!claimed && !adGranted) return `接口未确认到账（有效气泡 ${live.length}，过期气泡 ${expired.length}）`;
  return `领取气泡 ${claimed} 个，广告奖励确认 ${adGranted} 个`;
}

async function adToken(cookie) {
  const res = await api(cookie, "https://m.ximalaya.com/speed/task-center/ad/token");
  return (res && (res.id || (res.data && res.data.id))) || "";
}

async function adScore(cookie, uid, businessType, taskId) {
  const token = await adToken(cookie);
  if (!token) return null;
  const rsaSign = rsaEncryptPKCS1(
    `businessType=${businessType}&token=${token}&uid=${uid}`,
    PUBKEY_N,
    PUBKEY_E
  );
  return api(cookie, "https://m.ximalaya.com/speed/task-center/ad/score", {
    method: "POST",
    body: { taskId, businessType, rsaSign },
  });
}

async function boxAward(cookie, uid) {
  let count = 0;

  const box = await api(cookie, "https://mobile.ximalaya.com/pizza-category/activity/getAward?activtyId=baoxiangAward", {
    method: "POST",
  });
  if (box && box.ret === 0 && box.awardReceiveId) {
    const doubled = await api(
      cookie,
      `https://mobile.ximalaya.com/pizza-category/activity/awardMultiple?activtyId=baoxiangAward&awardReceiveId=${box.awardReceiveId}`
    );
    if (requestSucceeded(doubled)) count += 1;
  }

  const ms = Date.now() - 2;
  const index =
    `https://mobile.ximalaya.com/pizza-category/activity/getAward?activtyId=indexSegAward` +
    `&ballKey=${encodeURIComponent(uid)}&currentTimeMillis=${ms}` +
    `&sawVideoSignature=${encodeURIComponent(`${ms}+${uid}`)}&version=2`;
  const seg = await api(cookie, index);
  if (seg && seg.ret === 0 && seg.awardReceiveId) {
    const doubled = await api(
      cookie,
      `https://mobile.ximalaya.com/pizza-category/activity/awardMultiple?activtyId=indexSegAward&awardReceiveId=${seg.awardReceiveId}`,
      {}
    );
    if (requestSucceeded(doubled)) count += 1;
  }

  return count ? `领取 ${count} 次（含翻倍）` : "暂无可领取";
}

async function wallet(cookie) {
  const res = await api(cookie, "https://m.ximalaya.com/speed/web-earn/account/coin", {
    referer: "https://m.ximalaya.com/speed/web-earn/wallet",
  });
  if (!res || res.total === undefined) return null;
  const toCoin = (v) => (Number(v || 0) / 10000).toFixed(2);
  return { today: toCoin(res.todayTotal), history: toCoin(res.historyTotal) };
}

/* ---------------------------- HTTP ---------------------------- */

function api(cookie, url, opts) {
  const o = opts || {};
  const headers = headersFor(cookie, o.referer);
  const req = { url, headers };
  if (o.body !== undefined) {
    headers["Content-Type"] = "application/json;charset=utf-8";
    headers.Origin = "https://m.ximalaya.com";
    req.body = JSON.stringify(o.body);
  }

  const method = (o.method || "GET").toUpperCase();
  return new Promise((resolve, reject) => {
    const cb = (err, resp, data) => {
      if (err) return reject(new Error(err));
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        resolve({ raw: String(data || "").slice(0, 200), status: (resp && resp.status) || 0 });
      }
    };
    if (method === "POST") $httpClient.post(req, cb);
    else $httpClient.get(req, cb);
  });
}

function requestSucceeded(result) {
  if (!result || result.errorCode !== undefined) return false;
  if (result.ret !== undefined) return Number(result.ret) === 0;
  if (result.code !== undefined) return Number(result.code) === 0 || Number(result.code) === 200;
  if (result.success !== undefined) return result.success === true;
  return result.raw === undefined && result.status >= 200 && result.status < 300;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/* ---------------------------- RSA PKCS#1 v1.5 ---------------------------- */

function hexToBytes(hex) {
  const out = [];
  for (let i = 0; i < hex.length; i += 2) out.push(parseInt(hex.substr(i, 2), 16));
  return out;
}

function bytesToBig(bytes) {
  let hex = "";
  for (let i = 0; i < bytes.length; i++) hex += ("0" + (bytes[i] & 0xff).toString(16)).slice(-2);
  return BigInt("0x" + (hex || "0"));
}

function bigToBytes(n, len) {
  let hex = n.toString(16);
  if (hex.length % 2) hex = "0" + hex;
  const bytes = hexToBytes(hex);
  while (bytes.length < len) bytes.unshift(0);
  return bytes;
}

function utf8Bytes(str) {
  const out = [];
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    else out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
  }
  return out;
}

function modPow(base, exp, mod) {
  let result = BigInt(1);
  base = base % mod;
  while (exp > BigInt(0)) {
    if (exp & BigInt(1)) result = (result * base) % mod;
    exp >>= BigInt(1);
    base = (base * base) % mod;
  }
  return result;
}

function randByte() {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const buf = new Uint8Array(1);
    crypto.getRandomValues(buf);
    return buf[0];
  }
  return Math.floor(Math.random() * 256);
}

function base64(bytes) {
  const T = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];
    out += T[b0 >> 2];
    out += T[((b0 & 3) << 4) | ((b1 === undefined ? 0 : b1) >> 4)];
    out += b1 === undefined ? "=" : T[((b1 & 15) << 2) | ((b2 === undefined ? 0 : b2) >> 6)];
    out += b2 === undefined ? "=" : T[b2 & 63];
  }
  return out;
}

function rsaEncryptPKCS1(text, modulusHex, exponentHex) {
  const n = BigInt("0x" + modulusHex);
  const e = BigInt("0x" + exponentHex);
  const k = hexToBytes(modulusHex).length;
  const msg = utf8Bytes(text);
  if (msg.length > k - 11) throw new Error("RSA 明文过长");

  const ps = [];
  while (ps.length < k - msg.length - 3) {
    const b = randByte();
    if (b !== 0) ps.push(b);
  }
  const em = [0x00, 0x02].concat(ps, [0x00], msg);
  const c = modPow(bytesToBig(em), e, n);
  return base64(bigToBytes(c, k));
}
