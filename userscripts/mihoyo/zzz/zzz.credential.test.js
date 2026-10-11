/*
 * 回归测试：绝区零每日奖励凭据自愈（zzz.js 里的 #region zzz-credential）
 *
 * 这段逻辑解决的是 -100「尚未登录页面」：抓来的网页 Cookie 里 cookie_token 会过期，
 * 而 stoken 是长期凭据，可以随时兑换出新的 cookie_token。
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "zzz.js"), "utf8");
const region = source.split("// #region zzz-credential")[1].split("// #endregion zzz-credential")[0];
assert.ok(region && region.length > 500, "未能从 zzz.js 提取 zzz-credential 区域");

const sandbox = { module: { exports: {} }, console };
vm.runInNewContext(region, sandbox);
const zzz = sandbox.module.exports;

const STOKEN = "v2_secret_stoken_value";
const COOKIE_TOKEN = "secret_cookie_token_value";
const ACCOUNT_UID = "123456789";
const GAME_UID = "1012012345";

function httpStub(routes) {
  const calls = [];
  const http = async (url, headers) => {
    calls.push({ url, headers });
    for (const [fragment, response] of routes) {
      if (url.includes(fragment)) return typeof response === "function" ? response(url, headers) : response;
    }
    return { error: `unexpected url: ${url}` };
  };
  http.calls = calls;
  return http;
}

const mintOk = () => ({ data: { retcode: 0, data: { cookie_token: COOKIE_TOKEN, uid: ACCOUNT_UID } } });
const mintExpired = () => ({ data: { retcode: -100, message: "登录状态失效，请重新登录" } });
const rolesOk = (list) => ({ data: { retcode: 0, data: { list } } });
const oneRole = [{ game_uid: GAME_UID, region: "prod_gf_cn", nickname: "绳匠" }];
const storedCookie = `ltuid=${ACCOUNT_UID}; ltoken=stale; cookie_token=dead`;

(async () => {
  // 1. stoken 可用：自动兑换 + 自动解析角色，完全不需要抓来的网页 Cookie
  {
    const http = httpStub([
      ["getCookieAccountInfoBySToken", mintOk],
      ["getUserGameRolesByCookie", rolesOk(oneRole)],
    ]);
    const cred = await zzz.zzzResolveDailyCredential(http, {
      uid: "",
      cookie: "",
      stoken: STOKEN,
      mid: "mid_value",
      verify: () => ({ retcode: 0 }),
    });
    assert.equal(cred.ok, true);
    assert.equal(cred.source, "stoken 自动刷新");
    assert.equal(cred.uid, GAME_UID);
    assert.equal(cred.region, "prod_gf_cn");
    assert.match(cred.cookie, /^mid=mid_value; stoken=v2_secret_stoken_value; account_id=123456789; cookie_token=secret_cookie_token_value$/);
    assert.equal(http.calls.length, 2, "应为：兑换 cookie_token → 查询角色（验证签到接口由注入的 verify 负责）");
    assert.match(http.calls[0].url, /^https:\/\/api-takumi\.mihoyo\.com\/auth\/api\/getCookieAccountInfoBySToken\?/);
    assert.match(http.calls[1].url, /getUserGameRolesByCookie\?game_biz=nap_cn$/);
  }

  // 2. stoken 失效：退回已抓取 Cookie，并在尝试记录里写明原因
  {
    const http = httpStub([
      ["getCookieAccountInfoBySToken", mintExpired],
      ["getUserGameRolesByCookie", rolesOk(oneRole)],
    ]);
    const cred = await zzz.zzzResolveDailyCredential(http, {
      uid: GAME_UID,
      cookie: storedCookie,
      stoken: STOKEN,
      mid: "",
      verify: () => ({ retcode: 0 }),
    });
    assert.equal(cred.ok, true);
    assert.equal(cred.source, "已存每日奖励Cookie");
    assert.equal(cred.cookie, storedCookie);
    assert.ok(cred.attempts.some((line) => line.includes("stoken 兑换失败") && line.includes("-100")));
  }

  // 3. 全部失败：报告每一步原因，且只暴露字段名、不泄露凭据值
  {
    const http = httpStub([
      ["getCookieAccountInfoBySToken", mintExpired],
      ["getUserGameRolesByCookie", () => ({ data: { retcode: -100, message: "登录状态失效，请重新登录" } })],
    ]);
    const cred = await zzz.zzzResolveDailyCredential(http, {
      uid: "",
      cookie: storedCookie,
      stoken: STOKEN,
      mid: "",
      verify: () => ({ retcode: 0 }),
    });
    assert.equal(cred.ok, false);
    assert.equal(cred.attempts.length, 2, `应记录 stoken 与 Cookie 两条失败原因：${JSON.stringify(cred.attempts)}`);
    assert.ok(cred.attempts[0].includes("stoken 兑换失败"));
    assert.ok(cred.attempts[1].includes("凭据不可用"));
    assert.equal(cred.cookieFields, "ltuid、ltoken、cookie_token");
    assert.ok(!JSON.stringify(cred).includes("dead"), "失败信息里不能带出 cookie 值");
    assert.ok(!JSON.stringify(cred).includes(STOKEN), "失败信息里不能带出 stoken");
  }

  // 4. 没有 stoken 时给出可执行的提示，而不是笼统失败
  {
    const http = httpStub([["getUserGameRolesByCookie", rolesOk(oneRole)]]);
    const cred = await zzz.zzzResolveDailyCredential(http, {
      uid: GAME_UID,
      cookie: storedCookie,
      stoken: "",
      mid: "",
      verify: () => ({ retcode: 0 }),
    });
    assert.equal(cred.ok, true);
    assert.ok(cred.attempts.includes("未捕获到 stoken"));
  }

  // 5. 角色接口成功但签到接口仍 -100：继续尝试下一个候选并如实记录
  {
    const http = httpStub([
      ["getCookieAccountInfoBySToken", mintOk],
      ["getUserGameRolesByCookie", rolesOk(oneRole)],
    ]);
    const cred = await zzz.zzzResolveDailyCredential(http, {
      uid: GAME_UID,
      cookie: storedCookie,
      stoken: STOKEN,
      mid: "",
      verify: (cookie) => (/stoken/.test(cookie)
        ? { retcode: -100, message: "尚未登录页面，请检查网络环境后重新进入页面(-100)" }
        : { retcode: 0 }),
    });
    assert.equal(cred.ok, true);
    assert.equal(cred.source, "已存每日奖励Cookie");
    assert.ok(cred.attempts.some((line) => line.includes("尚未登录页面")));
  }

  // 6. 账号下没有绝区零角色时要有明确结论，而不是 -100 这种含糊错误
  {
    const http = httpStub([["getUserGameRolesByCookie", rolesOk([])]]);
    const cred = await zzz.zzzResolveDailyCredential(http, {
      uid: "",
      cookie: storedCookie,
      stoken: "",
      mid: "",
      verify: () => ({ retcode: 0 }),
    });
    assert.equal(cred.ok, false);
    assert.ok(cred.attempts.some((line) => line.includes("没有绝区零角色")));
  }

  // 7. 多角色时优先匹配已存 UID
  {
    const roles = [
      { game_uid: "1000000001", region: "prod_gf_cn", nickname: "小号" },
      { game_uid: GAME_UID, region: "prod_gf_cn", nickname: "大号" },
    ];
    const http = httpStub([["getUserGameRolesByCookie", rolesOk(roles)]]);
    const cred = await zzz.zzzResolveDailyCredential(http, {
      uid: GAME_UID,
      cookie: storedCookie,
      stoken: "",
      mid: "",
      verify: () => ({ retcode: 0 }),
    });
    assert.equal(cred.ok, true);
    assert.equal(cred.uid, GAME_UID);
    assert.equal(cred.nickname, "大号");
  }

  // 8. 网络错误要能被记录，而不是抛异常中断整个任务
  {
    const http = httpStub([["getUserGameRolesByCookie", () => ({ error: "timeout" })]]);
    const cred = await zzz.zzzResolveDailyCredential(http, {
      uid: "",
      cookie: storedCookie,
      stoken: "",
      mid: "",
      verify: () => ({ retcode: 0 }),
    });
    assert.equal(cred.ok, false);
    assert.ok(cred.attempts.some((line) => line.includes("timeout")));
  }

  // 9. Cookie 解析与拼接的边界
  {
    assert.equal(zzz.zzzCookieValue("a=1; b=2", ["b", "a"]), "2");
    assert.equal(zzz.zzzCookieValue("a=1", ["missing"]), "");
    assert.equal(zzz.zzzCookieFieldNames("stoken=s; mid=m"), "stoken、mid");
    assert.equal(zzz.zzzBuildDailyCookie({ accountId: "1", cookieToken: "ct" }), "account_id=1; cookie_token=ct");
    assert.equal(zzz.zzzBuildDailyCookie({}), "");
    assert.equal(zzz.ZZZ_DEFAULT_REGION, "prod_gf_cn");
    assert.match(zzz.ZZZ_TAKUMI_API, /^https:\/\/api-takumi\.mihoyo\.com$/);
  }

  console.log("zzz credential self-heal: ok");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
