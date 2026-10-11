/*
 * 集成测试：把真实的 zzz.js 主体放进模拟 Loon 运行时，用假网络跑完整「绝区零每日奖励签到」。
 * 目的：验证 00:10 cron 真实走的路径——stoken 自动续签 → 角色解析 → info → sign。
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const TOOLKIT_MARKER = "// * ToolKit v1.5.0 build 204";
const fullSource = fs.readFileSync(path.join(__dirname, "zzz.js"), "utf8");
// 去掉压缩的 ToolKit 实现，换成下面可控的假实现；同时不自动执行 main()
const body = fullSource.split(TOOLKIT_MARKER)[0].replace("if(!lk.isExecComm) main()", "");
assert.ok(body.includes("const doSignIn = async"), "未能剥离出脚本主体");

function runScenario({ store = {}, routes = [], sleepImpl } = {}) {
  const memory = new Map(Object.entries(store));
  const notifications = [];
  const requests = [];
  const logs = [];

  const pick = (url) => {
    for (const [fragment, response] of routes) {
      if (url.includes(fragment)) return typeof response === "function" ? response(url) : response;
    }
    return '{"retcode":-1,"message":"unexpected url","data":null}';
  };
  const call = (options, callback) => {
    const url = typeof options === "string" ? options : options.url;
    const headers = (typeof options === "object" && options.headers) || {};
    const body = (typeof options === "object" && options.body) || "";
    requests.push({ url, headers, body });
    const payload = pick(url);
    callback(null, { status: 200 }, typeof payload === "string" ? payload : JSON.stringify(payload));
  };

  class FakeToolKit {
    constructor(name, id) {
      this.name = name;
      this.id = id;
      this.isExecComm = false;
      this.now = new Date();
    }
    getVal(key, defaultValue) {
      return memory.has(key) ? memory.get(key) : defaultValue;
    }
    setVal(key, value) {
      memory.set(key, value);
    }
    get(options, callback) {
      call(options, callback);
    }
    post(options, callback) {
      call(options, callback);
    }
    log(message) {
      logs.push(String(message));
    }
    logErr(message) {
      logs.push(`ERR ${message}`);
    }
    appendNotifyInfo(info) {
      notifications.push(String(info));
    }
    prependNotifyInfo(info) {
      notifications.unshift(String(info));
    }
    execFail() {}
    isRequest() {
      return false;
    }
    isLoon() {
      return true;
    }
    done() {}
    msg() {}
    boxJsJsonBuilder() {}
    randomString(len) {
      return "abcdef".slice(0, len || 6);
    }
    sleep(ms) {
      return sleepImpl ? sleepImpl(ms) : Promise.resolve();
    }
    randomSleep() {
      return Promise.resolve();
    }
  }

  const sandbox = {
    ToolKit: FakeToolKit,
    console: { log() {}, warn() {}, error() {} },
    setTimeout: (fn) => { fn(); return 0; },
    $persistentStore: {
      read: (key) => (memory.has(key) ? memory.get(key) : null),
      write: (value, key) => (memory.set(key, value), true),
    },
  };

  vm.createContext(sandbox);
  // ToolKit 在真实运行时会给 Object.prototype 挂 o()/s()，这里补上同名实现
  vm.runInContext(
    "Object.prototype.o = function () { return JSON.parse(String(this)); };" +
    "Object.prototype.s = function (space, indent) { return JSON.stringify(this, space, indent); };",
    sandbox,
  );
  vm.runInContext(`${body}\n;globalThis.__all = all;`, sandbox);
  return { sandbox, memory, notifications, requests, logs };
}

const GAME_UID = "1012012345";
const ACCOUNT_UID = "123456789";
const STOKEN = "v2_secret_stoken";
const MINTED = "secret_minted_cookie_token";

const zzzRoutes = [
  ["/auth/api/getCookieAccountInfoBySToken", { retcode: 0, message: "OK", data: { cookie_token: MINTED, uid: ACCOUNT_UID } }],
  ["/binding/api/getUserGameRolesByCookie", { retcode: 0, message: "OK", data: { list: [{ game_uid: GAME_UID, region: "prod_gf_cn", nickname: "绳匠" }] } }],
  ["/event/luna/zzz/info", { retcode: 0, message: "OK", data: { is_sign: false, total_sign_day: 12 } }],
  ["/event/luna/zzz/sign", { retcode: 0, message: "OK", data: { success: 1, is_risk: false } }],
];

(async () => {
  // 场景 1：有 stoken，抓来的网页 Cookie 已过期 —— 这正是用户当前的情况
  {
    const scenario = runScenario({
      store: {
        zzzStokenKey: STOKEN,
        zzzMidKey: "mid_value",
        zzzCookieKey: "ltuid=123456789; ltoken=stale; cookie_token=dead",
        zzzUidKey: "999999999",
        zzzDfpKey: "dfp_value",
      },
      routes: zzzRoutes,
    });
    await scenario.sandbox.__all();

    const infoRequest = scenario.requests.find((r) => r.url.includes("/event/luna/zzz/info"));
    assert.ok(infoRequest, "必须调用 luna info");
    assert.match(infoRequest.url, new RegExp(`uid=${GAME_UID}`), "UID 应来自角色接口，而不是过期的抓取值");
    assert.match(infoRequest.url, /region=prod_gf_cn/);
    assert.match(infoRequest.headers.cookie, new RegExp(`cookie_token=${MINTED}`), "必须使用新兑换的 cookie_token");
    assert.match(infoRequest.headers.cookie, new RegExp(`stoken=${STOKEN}`));
    assert.match(infoRequest.headers.cookie, new RegExp(`account_id=${ACCOUNT_UID}`));
    assert.equal(infoRequest.headers["x-rpc-signgame"], "zzz");

    const signRequest = scenario.requests.find((r) => r.url.includes("/event/luna/zzz/sign"));
    assert.ok(signRequest, "未签到时应执行签到");
    assert.ok(signRequest.body.includes(GAME_UID));
    assert.ok(signRequest.body.includes("prod_gf_cn"));

    assert.ok(scenario.notifications.some((n) => n.includes("🎉") && n.includes("成功")), scenario.notifications.join(" | "));
    assert.equal(scenario.memory.get("zzzUidKey"), GAME_UID, "解析出的 UID 应回写，供下次使用");
  }

  // 场景 2：无 stoken 且 Cookie 失效 —— 必须给出可执行的下一步，而不是含糊的 -100
  {
    const scenario = runScenario({
      store: { zzzCookieKey: "ltuid=123456789; ltoken=stale" },
      routes: [
        ["/binding/api/getUserGameRolesByCookie", { retcode: -100, message: "登录状态失效，请重新登录", data: null }],
        ["/event/luna/zzz/info", { retcode: -100, message: "尚未登录页面，请检查网络环境后重新进入页面(-100)", data: null }],
      ],
    });
    await scenario.sandbox.__all();

    const failure = scenario.notifications.find((n) => n.includes("绝区零每日奖励签到失败"));
    assert.ok(failure, scenario.notifications.join(" | "));
    assert.ok(failure.includes("未捕获到 stoken"), `失败原因应说明缺 stoken：${failure}`);
    assert.ok(scenario.notifications.some((n) => n.includes("💡") && n.includes("stoken")), "应给出如何获取 stoken 的提示");
  }

  // 场景 3：已签到过，不应重复签到
  {
    const scenario = runScenario({
      store: { zzzStokenKey: STOKEN, zzzMidKey: "mid_value" },
      routes: zzzRoutes.map(([fragment, response]) => (
        fragment.includes("/info") ? [fragment, { retcode: 0, message: "OK", data: { is_sign: true } }] : [fragment, response]
      )),
    });
    await scenario.sandbox.__all();
    assert.ok(scenario.notifications.some((n) => n.includes("已经签到过了")));
    assert.ok(!scenario.requests.some((r) => r.url.includes("/event/luna/zzz/sign")), "已签到就不该再发签到请求");
  }

  console.log("zzz daily reward integration: ok");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
