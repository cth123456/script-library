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
  autoSignDate: "zzzDailyRewardAutoSignDate",
  autoSignAttempt: "zzzDailyRewardAutoSignAttempt",
};
const ACT_ID = "e202406242138391";
const REGION = "prod_gf_cn";
const ACT_DOMAIN = "https://act-nap-api.mihoyo.com";
const DEFAULT_APP_VERSION = "2.71.1";
const SALT_6X = "t0qEgfub6cvueAPgR5m9aQWWVciEer7v";

const MD5 = function(d){result = M(V(Y(X(d),8*d.length)));return result.toLowerCase()};function M(d){for(var _,m="0123456789ABCDEF",f="",r=0;r<d.length;r++)_=d.charCodeAt(r),f+=m.charAt(_>>>4&15)+m.charAt(15&_);return f}function X(d){for(var _=Array(d.length>>2),m=0;m<_.length;m++)_[m]=0;for(m=0;m<8*d.length;m+=8)_[m>>5]|=(255&d.charCodeAt(m/8))<<m%32;return _}function V(d){for(var _="",m=0;m<32*d.length;m+=8)_+=String.fromCharCode(d[m>>5]>>>m%32&255);return _}function Y(d,_){d[_>>5]|=128<<_%32,d[14+(_+64>>>9<<4)]=_;for(var m=1732584193,f=-271733879,r=-1732584194,i=271733878,n=0;n<d.length;n+=16){var h=m,t=f,g=r,e=i;f=md5_ii(f=md5_ii(f=md5_ii(f=md5_ii(f=md5_hh(f=md5_hh(f=md5_hh(f=md5_hh(f=md5_gg(f=md5_gg(f=md5_gg(f=md5_gg(f=md5_ff(f=md5_ff(f=md5_ff(f=md5_ff(f,r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+0],7,-680876936),f,r,d[n+1],12,-389564586),m,f,d[n+2],17,606105819),i,m,d[n+3],22,-1044525330),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+4],7,-176418897),f,r,d[n+5],12,1200080426),m,f,d[n+6],17,-1473231341),i,m,d[n+7],22,-45705983),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+8],7,1770035416),f,r,d[n+9],12,-1958414417),m,f,d[n+10],17,-42063),i,m,d[n+11],22,-1990404162),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+12],7,1804603682),f,r,d[n+13],12,-40341101),m,f,d[n+14],17,-1502002290),i,m,d[n+15],22,1236535329),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+1],5,-165796510),f,r,d[n+6],9,-1069501632),m,f,d[n+11],14,643717713),i,m,d[n+0],20,-373897302),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+5],5,-701558691),f,r,d[n+10],9,38016083),m,f,d[n+15],14,-660478335),i,m,d[n+4],20,-405537848),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+9],5,568446438),f,r,d[n+14],9,-1019803690),m,f,d[n+3],14,-187363961),i,m,d[n+8],20,1163531501),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+13],5,-1444681467),f,r,d[n+2],9,-51403784),m,f,d[n+7],14,1735328473),i,m,d[n+12],20,-1926607734),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+5],4,-378558),f,r,d[n+8],11,-2022574463),m,f,d[n+11],16,1839030562),i,m,d[n+14],23,-35309556),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+1],4,-1530992060),f,r,d[n+4],11,1272893353),m,f,d[n+7],16,-155497632),i,m,d[n+10],23,-1094730640),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+13],4,681279174),f,r,d[n+0],11,-358537222),m,f,d[n+3],16,-722521979),i,m,d[n+6],23,76029189),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+9],4,-640364487),f,r,d[n+12],11,-421815835),m,f,d[n+15],16,530742520),i,m,d[n+2],23,-995338651),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+0],6,-198630844),f,r,d[n+7],10,1126891415),m,f,d[n+14],15,-1416354905),i,m,d[n+5],21,-57434055),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+12],6,1700485571),f,r,d[n+3],10,-1894986606),m,f,d[n+10],15,-1051523),i,m,d[n+1],21,-2054922799),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+8],6,1873313359),f,r,d[n+15],10,-30611744),m,f,d[n+6],15,-1560198380),i,m,d[n+13],21,1309151649),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+4],6,-145523070),f,r,d[n+11],10,-1120210379),m,f,d[n+2],15,718787259),i,m,d[n+9],21,-343485551),m=safe_add(m,h),f=safe_add(f,t),r=safe_add(r,g),i=safe_add(i,e)}return Array(m,f,r,i)}function md5_cmn(d,_,m,f,r,i){return safe_add(bit_rol(safe_add(safe_add(_,d),safe_add(f,i)),r),m)}function md5_ff(d,_,m,f,r,i,n){return md5_cmn(_&m|~_&f,d,_,r,i,n)}function md5_gg(d,_,m,f,r,i,n){return md5_cmn(_&f|m&~f,d,_,r,i,n)}function md5_hh(d,_,m,f,r,i,n){return md5_cmn(_^m^f,d,_,r,i,n)}function md5_ii(d,_,m,f,r,i,n){return md5_cmn(m^(_|~f),d,_,r,i,n)}function safe_add(d,_){var m=(65535&d)+(65535&_);return(d>>16)+(_>>16)+(m>>16)<<16|65535&m}function bit_rol(d,_){return d<<_|d>>>32-_}

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

function todayString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function randomString(len) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
  let out = "";
  for (let i = 0; i < (len || 6); i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
  return out;
}

function dailyCheckinDs(body) {
  const timestamp = Math.floor(Date.now() / 1000);
  const random = randomString(6);
  let source = `salt=${SALT_6X}&t=${timestamp}&r=${random}`;
  if (body) source += `&b=${body}&q=`;
  return `${timestamp},${random},${MD5(source)}`;
}

function requestJson(options, method) {
  return new Promise((resolve) => {
    const client = typeof $httpClient !== "undefined" ? $httpClient : null;
    if (!client) return resolve({ retcode: -1, message: "当前环境不支持网络请求" });
    const callback = (_err, _resp, body) => {
      try {
        resolve(typeof body === "string" ? JSON.parse(body) : body);
      } catch (_) {
        resolve({ retcode: -1, message: "接口返回无法解析", raw: body });
      }
    };
    if (method === "POST") client.post(options, callback);
    else client.get(options, callback);
  });
}

async function autoSignDailyReward() {
  const today = todayString();
  if (read(KEYS.autoSignDate) === today) return;

  const lastAttempt = Number(read(KEYS.autoSignAttempt) || 0);
  if (Date.now() - lastAttempt < 3 * 60 * 1000) return;
  $persistentStore.write(String(Date.now()), KEYS.autoSignAttempt);

  const uid = read(KEYS.uid);
  const cookie = read(KEYS.signCookie);
  const dfp = read(KEYS.dfp);
  const appVersion = read(KEYS.appVersion) || DEFAULT_APP_VERSION;
  const missing = [];
  if (!uid) missing.push("UID");
  if (!cookie) missing.push("每日奖励Cookie");
  if (!dfp) missing.push("设备指纹");
  if (missing.length) {
    notify("⚠️ 每日奖励未自动签到", `缺少：${missing.join("、")}，请在签到页停留几秒后刷新`);
    return;
  }

  const commonHeaders = {
    cookie,
    "x-rpc-signgame": "zzz",
    "x-rpc-device_fp": dfp,
    "x-rpc-client_type": 5,
    "x-rpc-app_version": appVersion,
  };
  const info = await requestJson({
    url: `${ACT_DOMAIN}/event/luna/zzz/info?lang=zh-cn&act_id=${ACT_ID}&region=${REGION}&uid=${uid}`,
    headers: commonHeaders,
  });

  if (info?.retcode !== 0) {
    notify("❌ 每日奖励自动签到失败", info?.message || "获取签到信息失败，请重新抓取 Cookie");
    return;
  }
  if (info?.data?.is_sign) {
    $persistentStore.write(today, KEYS.autoSignDate);
    notify("✅ 每日奖励已签到", "今天已领取，无需重复操作");
    return;
  }

  const body = JSON.stringify({ act_id: ACT_ID, region: REGION, uid: String(uid), lang: "zh-cn" });
  const signRet = await requestJson({
    url: `${ACT_DOMAIN}/event/luna/zzz/sign`,
    headers: {
      ...commonHeaders,
      ds: dailyCheckinDs(body),
    },
    body,
  }, "POST");

  if (signRet?.retcode !== 0) {
    notify("❌ 每日奖励自动签到失败", signRet?.message || "签到接口返回异常");
    return;
  }
  if (signRet?.data?.is_risk) {
    notify("❌ 每日奖励自动签到失败", "触发风控验证码，请手动打开页面处理");
    return;
  }
  $persistentStore.write(today, KEYS.autoSignDate);
  notify("🎉 每日奖励自动签到成功", "页面如果仍显示未领取，刷新签到页即可");
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

  const isZzzSignPage = host === "act.mihoyo.com" && /bbs\/event\/signin\/zzz/i.test(url);
  const isZzzAct = host === "act-nap-api.mihoyo.com" || /event\/luna\/zzz/i.test(url) || isZzzSignPage;
  const isBbs = host === "bbs-api.miyoushe.com";
  const isTakumi = host === "api-takumi.mihoyo.com" || host === "api-takumi-record.mihoyo.com";

  if (dfp) write(KEYS.dfp, dfp, "设备指纹", updates);
  if (appVersion) write(KEYS.appVersion, appVersion, "App版本", updates);
  if (uid) write(KEYS.uid, uid, "UID", updates);

  if (cookie && looksLikeMihoyoCookie(cookie)) {
    if (isZzzAct) write(KEYS.signCookie, cookie, "绝区零每日奖励Cookie", updates);
    if (isBbs || isTakumi) write(KEYS.bbsCookie, cookie, "米游社Cookie", updates);

    // The original script requires both cookies. If only one side is observed,
    // seed the missing side so cron can at least run and expose real API errors.
    if (!read(KEYS.signCookie)) write(KEYS.signCookie, cookie, "绝区零每日奖励Cookie", updates);
    if (!read(KEYS.bbsCookie)) write(KEYS.bbsCookie, cookie, "米游社Cookie", updates);
  }

  if (updates.length > 0) {
    const missing = [];
    if (!read(KEYS.uid)) missing.push("UID");
    if (!read(KEYS.signCookie)) missing.push("每日奖励Cookie");
    if (!read(KEYS.bbsCookie)) missing.push("米游社Cookie");
    if (!read(KEYS.dfp)) missing.push("设备指纹");
    const suffix = missing.length ? `；还缺：${missing.join("、")}` : "；必要参数已齐";
    notify("✅ 获取成功", `${updates.join("、")} 已保存${suffix}`);
  }

  if (isZzzAct) {
    autoSignDailyReward()
      .then(() => done())
      .catch((err) => {
        notify("❌ 每日奖励自动签到错误", String(err?.message || err || "未知错误"));
        done();
      });
    return;
  }

  done();
})();
