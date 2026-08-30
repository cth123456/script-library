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

const unrelated = capture(
  "https://api-takumi.mihoyo.com/game_record/card/wapi/getGameRecordCard?uid=123456789",
  { Cookie: "ltoken_v2=v2_account; ltmid_v2=123456789" },
);
assert.deepEqual(unrelated, {});

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
