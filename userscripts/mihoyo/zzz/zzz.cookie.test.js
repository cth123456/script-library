const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "zzz.cookie.js"), "utf8");

function capture(url, headers = {}, responseBody) {
  const store = {};
  const context = {
    $request: { url, headers },
    $response: responseBody === undefined ? undefined : { body: responseBody },
    $persistentStore: {
      read: (key) => store[key] || null,
      write: (value, key) => (store[key] = value, true),
    },
    $notification: { post() {} },
    $done() {},
  };
  vm.runInNewContext(source, context);
  return store;
}

const bbs = capture(
  "https://bbs-api.miyoushe.com/post/api/getForumPostList?uid=123456789",
  { Cookie: "stoken=v2_forum; stuid=123456789" },
);
assert.equal(bbs.zzzBbsCookieKey, "stoken=v2_forum; stuid=123456789");
assert.equal(bbs.zzzCookieKey, undefined);
assert.equal(bbs.zzzUidKey, undefined);
assert.equal(bbs.zzzStokenKey, "v2_forum", "社区 Cookie 里的 stoken 要留存，用于自动续签");

// 与绝区零无关的通行证请求：可以留存长期凭据，但绝不能污染 UID / 每日奖励 Cookie
const unrelated = capture(
  "https://api-takumi.mihoyo.com/game_record/card/wapi/getGameRecordCard?uid=123456789",
  { Cookie: "ltoken_v2=v2_account; ltmid_v2=123456789" },
);
assert.equal(unrelated.zzzUidKey, undefined);
assert.equal(unrelated.zzzCookieKey, undefined);
assert.equal(unrelated.zzzBbsCookieKey, undefined);
assert.equal(unrelated.zzzStokenKey, undefined);
assert.equal(unrelated.zzzMidKey, "123456789", "ltmid_v2 可作为 stoken 的 mid 使用");

// 通行证请求里出现 stoken：harvest 到长期凭据，这是自动续签的关键来源
const takumiStoken = capture(
  "https://api-takumi.mihoyo.com/binding/api/getUserGameRolesByStoken?game_biz=nap_cn",
  { Cookie: "stuid=123456789; stoken=v2_account_stoken; mid=mid_from_app" },
);
assert.equal(takumiStoken.zzzStokenKey, "v2_account_stoken");
assert.equal(takumiStoken.zzzMidKey, "mid_from_app");
assert.equal(takumiStoken.zzzUidKey, undefined);
assert.equal(takumiStoken.zzzCookieKey, undefined);

// 只有 ltoken 的请求不能被当成 stoken
const ltokenOnly = capture(
  "https://api-takumi.mihoyo.com/binding/api/getUserGameRolesByCookie?game_biz=nap_cn",
  { Cookie: "ltuid=123456789; ltoken=v2_ltoken_only" },
);
assert.equal(ltokenOnly.zzzStokenKey, undefined);

const signPage = capture(
  "https://act.mihoyo.com/bbs/event/signin/zzz/e202406242138391.html",
  { Cookie: "ltoken_v2=v2_sign_page; ltmid_v2=123456789" },
);
assert.equal(signPage.zzzCookieKey, undefined);
assert.equal(signPage.zzzUidKey, undefined);

const signPageWithDailyCookie = capture(
  "https://act.mihoyo.com/bbs/event/signin/zzz/e202406242138391.html",
  { Cookie: "ltoken_v2=v2_sign_page; cookie_token_v2=v2_daily; account_id_v2=123456789" },
);
assert.equal(
  signPageWithDailyCookie.zzzCookieKey,
  "ltoken_v2=v2_sign_page; cookie_token_v2=v2_daily; account_id_v2=123456789",
);

const legacyDaily = capture(
  "https://api-takumi.mihoyo.com/event/luna/zzz/info?uid=100000002",
  { Cookie: "cookie_token_v2=v2_legacy; account_id_v2=123456789" },
);
assert.equal(legacyDaily.zzzUidKey, "100000002");
assert.equal(legacyDaily.zzzCookieKey, "cookie_token_v2=v2_legacy; account_id_v2=123456789");

const daily = capture(
  "https://act-nap-api.mihoyo.com/event/luna/zzz/info?uid=100000001",
  {
    Cookie: "cookie_token_v2=v2_daily; account_id_v2=123456789",
    "x-rpc-device_fp": "device-fingerprint",
  },
);
assert.equal(daily.zzzUidKey, "100000001");
assert.equal(daily.zzzCookieKey, "cookie_token_v2=v2_daily; account_id_v2=123456789");
assert.equal(daily.zzzDfpKey, "device-fingerprint");
assert.equal(daily.zzzBbsCookieKey, undefined);

console.log("zzz.cookie capture boundaries: ok");
