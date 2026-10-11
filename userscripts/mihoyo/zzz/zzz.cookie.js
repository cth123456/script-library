/*
 * 绝区零 / 米游社 Cookie capture for Loon
 * Stores the keys used by lowking's zzz.js:
 * zzzUidKey, zzzCookieKey, zzzDfpKey, zzzBbsCookieKey, appVersionKey
 * 以及长期凭据 zzzStokenKey / zzzMidKey（用于脚本自动续签每日奖励）
 */
const NAME = "绝区零Cookie";
const KEYS = {
  uid: "zzzUidKey",
  signCookie: "zzzCookieKey",
  bbsCookie: "zzzBbsCookieKey",
  stoken: "zzzStokenKey",
  mid: "zzzMidKey",
  dfp: "zzzDfpKey",
  appVersion: "appVersionKey",
  deviceId: "zzzDeviceIdKey",
  deviceModel: "zzzDeviceModelKey",
  deviceName: "zzzDeviceNameKey",
};

const STOKEN_FIELDS = ["stoken", "stoken_v2"];
const MID_FIELDS = ["mid", "account_mid_v2", "ltmid_v2", "account_mid"];


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

function cookieField(cookie, names) {
  const map = {};
  String(cookie || "").split(";").forEach((part) => {
    const i = part.indexOf("=");
    if (i <= 0) return;
    const key = part.slice(0, i).trim();
    if (key) map[key] = part.slice(i + 1).trim();
  });
  for (const name of names) {
    if (map[name]) return map[name];
  }
  return "";
}

function looksLikeDailyRewardCookie(cookie) {
  return looksLikeMihoyoCookie(cookie)
    && /(?:cookie_token|account_id)(?:_v2)?=/i.test(cookie || "");
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
  const deviceId = String(header(headers, "x-rpc-device_id") || header(headers, "x-rpc-device-id") || "").trim();
  const deviceModel = String(header(headers, "x-rpc-device_model") || header(headers, "x-rpc-device-model") || "").trim();
  const deviceName = String(header(headers, "x-rpc-device_name") || header(headers, "x-rpc-device-name") || "").trim();
  const updates = [];

  const isZzzSignPage = host === "act.mihoyo.com" && /\/bbs\/event\/signin\/zzz\//i.test(url);
  const isZzzApi = (host === "act-nap-api.mihoyo.com" || host === "api-takumi.mihoyo.com")
    && /\/event\/luna\/zzz(?:\/|[?#]|$)/i.test(url);
  const isBbs = host === "bbs-api.miyoushe.com";

  if (isZzzSignPage || isZzzApi) {
    const uid = isZzzApi ? pickUid(url + "\n" + bodyText(req, resp)) : "";
    if (dfp) write(KEYS.dfp, dfp, "设备指纹", updates);
    if (appVersion) write(KEYS.appVersion, appVersion, "App版本", updates);
    if (deviceId) write(KEYS.deviceId, deviceId, "设备ID", updates);
    if (deviceModel) write(KEYS.deviceModel, deviceModel, "设备型号", updates);
    if (deviceName) write(KEYS.deviceName, deviceName, "设备名称", updates);
    if (uid) write(KEYS.uid, uid, "UID", updates);
    if (cookie && looksLikeDailyRewardCookie(cookie)) {
      write(KEYS.signCookie, cookie, "绝区零每日奖励Cookie", updates);
    }
  }

  if (isBbs && cookie && looksLikeMihoyoCookie(cookie)) {
    write(KEYS.bbsCookie, cookie, "米游社Cookie", updates);
  }

  // 长期凭据：任何被拦截请求里出现 stoken/mid 都保存下来，供脚本自动续签每日奖励
  if (cookie && looksLikeMihoyoCookie(cookie)) {
    const stoken = cookieField(cookie, STOKEN_FIELDS);
    if (stoken) write(KEYS.stoken, stoken, "米游社SToken", updates);
    const mid = cookieField(cookie, MID_FIELDS);
    if (mid) write(KEYS.mid, mid, "账号Mid", updates);
  }

  if (updates.length > 0) {
    const missing = [];
    if (!read(KEYS.uid)) missing.push("UID");
    if (!read(KEYS.signCookie)) missing.push("每日奖励Cookie");
    if (!read(KEYS.bbsCookie)) missing.push("米游社Cookie");
    if (!read(KEYS.dfp)) missing.push("设备指纹");
    if (!read(KEYS.stoken)) missing.push("SToken");
    const suffix = missing.length ? `；还缺：${missing.join("、")}` : "；必要参数已齐";
    notify("✅ 获取成功", `${updates.join("、")} 已保存${suffix}`);
  }

  done();
})();
