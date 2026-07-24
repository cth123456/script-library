/*
 * 绝区零 / 米游社 Cookie capture for Loon
 * Stores the keys used by lowking's zzz.js:
 * zzzUidKey, zzzCookieKey, zzzDfpKey, zzzBbsCookieKey, appVersionKey
 */
const NAME = "绝区零Cookie";
const KEYS = {
  uid: "zzzUidKey",
  signCookie: "zzzCookieKey",
  bbsCookie: "zzzBbsCookieKey",
  dfp: "zzzDfpKey",
  appVersion: "appVersionKey",
};

function read(key) {
  try {
    if (typeof $persistentStore !== "undefined") return $persistentStore.read(key);
  } catch (_) {}
  return null;
}

function write(key, value, label, updates) {
  if (!value) return false;
  const normalized = String(value).trim();
  if (!normalized) return false;
  const old = read(key);
  if (old === normalized) return false;
  const ok = $persistentStore.write(normalized, key);
  if (ok && updates) updates.push(label);
  return ok;
}

function header(headers, name) {
  if (!headers) return "";
  const lower = name.toLowerCase();
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === lower) return headers[key];
  }
  return "";
}

function hostOf(url) {
  const m = String(url || "").match(/^https?:\/\/([^/?#]+)/i);
  return m ? m[1].toLowerCase() : "";
}

function bodyText(req, resp) {
  const parts = [];
  if (req && typeof req.body === "string") parts.push(req.body);
  if (resp && typeof resp.body === "string") parts.push(resp.body);
  return parts.join("\n");
}

function tryDecode(value) {
  try { return decodeURIComponent(value); } catch (_) { return value; }
}

function pickUid(text) {
  if (!text) return "";
  const decoded = tryDecode(String(text));
  const patterns = [
    /[?&](?:uid|game_uid|gameUid|role_id|roleId)=([0-9]{6,12})/i,
    /"(?:uid|game_uid|gameUid|role_id|roleId)"\s*:\s*"?([0-9]{6,12})"?/i,
    /(?:uid|game_uid|gameUid|role_id|roleId)=([0-9]{6,12})/i,
  ];
  for (const re of patterns) {
    const m = decoded.match(re);
    if (m && m[1]) return m[1];
  }
  return "";
}

function looksLikeMihoyoCookie(cookie) {
  return /(ltoken|ltuid|stoken|stuid|account_id|account_mid|cookie_token|login_ticket)/i.test(cookie || "");
}

function notify(subtitle, message) {
  if (typeof $notification !== "undefined") $notification.post(NAME, subtitle || "", message || "");
}

function done(value) {
  if (typeof $done !== "undefined") $done(value || {});
}

(function main() {
  if (typeof $request === "undefined") return done();

  const req = $request;
  const resp = typeof $response !== "undefined" ? $response : null;
  const url = req.url || "";
  const host = hostOf(url);
  const headers = req.headers || {};
  const cookie = String(header(headers, "cookie") || header(headers, "Cookie") || "").trim();
  const dfp = String(header(headers, "x-rpc-device_fp") || header(headers, "x-rpc-device-fp") || "").trim();
  const appVersion = String(header(headers, "x-rpc-app_version") || header(headers, "x-rpc-app-version") || "").trim();
  const uid = pickUid(url + "\n" + bodyText(req, resp));
  const updates = [];

  const isZzzAct = host === "act-nap-api.mihoyo.com" || /event\/luna\/zzz/i.test(url);
  const isBbs = host === "bbs-api.miyoushe.com";
  const isTakumi = host === "api-takumi.mihoyo.com" || host === "api-takumi-record.mihoyo.com";

  if (dfp) write(KEYS.dfp, dfp, "设备指纹", updates);
  if (appVersion) write(KEYS.appVersion, appVersion, "App版本", updates);
  if (uid) write(KEYS.uid, uid, "UID", updates);

  if (cookie && looksLikeMihoyoCookie(cookie)) {
    if (isZzzAct) write(KEYS.signCookie, cookie, "日常签到Cookie", updates);
    if (isBbs || isTakumi) write(KEYS.bbsCookie, cookie, "米游社Cookie", updates);

    // The original script requires both cookies. If only one side is observed,
    // seed the missing side so cron can at least run and expose real API errors.
    if (!read(KEYS.signCookie)) write(KEYS.signCookie, cookie, "日常签到Cookie", updates);
    if (!read(KEYS.bbsCookie)) write(KEYS.bbsCookie, cookie, "米游社Cookie", updates);
  }

  if (updates.length > 0) {
    const missing = [];
    if (!read(KEYS.uid)) missing.push("UID");
    if (!read(KEYS.signCookie)) missing.push("签到Cookie");
    if (!read(KEYS.bbsCookie)) missing.push("米游社Cookie");
    if (!read(KEYS.dfp)) missing.push("设备指纹");
    const suffix = missing.length ? `；还缺：${missing.join("、")}` : "；必要参数已齐";
    notify("✅ 获取成功", `${updates.join("、")} 已保存${suffix}`);
  }

  done();
})();
