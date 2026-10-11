# 绝区零每日奖励 + 米游社社区打卡 Loon 插件

Source: https://github.com/lowking/Scripts/blob/master/mihoyo/zzz.js

This directory mirrors `zzz.js` and adds `zzz.cookie.js`, a Loon request/response capture helper that writes the persistent keys expected by the original script.

It runs both supported sign-in paths:

- 绝区零每日奖励签到: `act-nap-api.mihoyo.com/event/luna/zzz`
- 米游社社区打卡: `bbs-api.miyoushe.com/apihub/app/api/signIn`

持久化键（`zzz.cookie.js` 自动维护，也可在 BoxJs 手动填写）：

- `zzzStokenKey` / `zzzMidKey` — 长期凭据，用于自动续签（关键）
- `zzzUidKey` — 游戏内 UID（脚本会自动用角色接口校正）
- `zzzCookieKey` — 抓取到的每日奖励 Cookie（备用）
- `zzzBbsCookieKey` — 米游社社区 Cookie
- `zzzDfpKey` / `zzzDeviceIdKey` / `appVersionKey`

Recommended Loon plugin:

```text
https://raw.githubusercontent.com/cth123456/script-library/main/userscripts/mihoyo/zzz/zzz-loon.plugin
```

Capture flow:

1. Install the plugin and enable MITM for the listed hosts.
2. Keep `Cookie 抓取` enabled.
3. 在米游社里打开绝区零游戏中心（或重新登录一次），让脚本抓到 `stoken`/`mid`。通知里出现「米游社SToken 已保存」即成功。
4. Open 米游社, enter the 绝区零每日签到 page. The capture script only saves parameters; daily reward claiming is handled by the cron script.
5. Enter the 绝区零 community page until the notification says the community parameters are complete.
6. Keep `定时签到` enabled for the daily 00:10 cron. `Cookie 抓取` 建议保持开启，Cookie 过期后能自动更新。

## 每日奖励为什么会失败，以及怎么彻底修好

每日奖励接口（`/event/luna/zzz/*`）在凭据不被认可时返回：

```json
{"retcode":-100,"message":"尚未登录页面，请检查网络环境后重新进入页面(-100)"}
```

这个 `-100` 与网络无关，含义是 **Cookie 里的 `cookie_token` 已失效**（社区接口用 `ltoken`，寿命更长，所以会出现「点赞正常、签到失败」）。抓取来的 Cookie 只是某一时刻的快照，过期后没人刷新，于是长期失败。

现在的做法与维护中的同类实现一致（`sign-task`、`MihoyoBBSTools`、UIGF-org 的 Token 文档）：

1. 用长期凭据 `stoken` 调 `api-takumi.mihoyo.com/auth/api/getCookieAccountInfoBySToken` 兑换**新的** `cookie_token`；
2. 用 `binding/api/getUserGameRolesByCookie?game_biz=nap_cn` 校验凭据并取回**真实的 `uid`/`region`**（顺带消除 UID 填错导致的 `-10002`）；
3. 用这份临时 Cookie 调 `info` → `sign`；失败时才退回已抓取的 Cookie。

因此只要 `stoken` 在，Cookie 过期能自愈；通知里失败原因会逐步列出（stoken 兑换、角色校验、签到接口分别的结果）。

如果通知里出现「未捕获到 stoken」，按提示在米游社内打开绝区零游戏中心或重新登录一次；仍抓不到时，可把 stoken 手动填进 BoxJs 的「米游社SToken」（v2 stoken 还需要「米游社账号Mid」）。

Notes:

- The original script says it was only tested on Surge. This wrapper only adds Loon capture and plugin packaging; it does not rewrite the original signing logic.
- 每日奖励 Cookie 只从绝区零签到页或绝区零活动专用路径保存，且必须包含 `cookie_token` 或 `account_id`；只含 `ltoken/ltuid` 的页面登录态不会覆盖有效 Cookie。UID 只从新旧绝区零活动接口保存；社区 Cookie 只从 `bbs-api.miyoushe.com` 保存，避免两个账号上下文互相覆盖。
- 更新本插件后，请重新开启一次 `Cookie 抓取` 并进入绝区零每日签到页，让正确的 UID/Cookie 覆盖旧值。
- Opening the 绝区零每日签到 page only captures parameters. If cron runs without the community Cookie, the daily reward sign-in still runs and community tasks are skipped.
- 米游社分享任务和发帖任务默认关闭。你发来的日志里这两个接口返回 `invalid request`，所以插件默认只跑已确认可用的签到、浏览、点赞等任务。
- If cron runs but reports API risk/captcha or activity errors, that is upstream API behavior and needs a newer signing logic.
- If cron reports an invalid daily reward Cookie, enable `Cookie 抓取` and reopen the ZZZ sign-in page so a Cookie containing `cookie_token` or `account_id` is captured.
- 社区打卡返回「触发风控验证码」属于米游社风控（geetest），脚本无法自动过验证码；等一段时间再试即可，与每日奖励失败是两件独立的事。
- Cookie values are credentials. Do not share logs or screenshots containing them.

## 回归测试

```bash
node userscripts/mihoyo/zzz/zzz.credential.test.js    # stoken→cookie_token、角色解析、失败路径
node userscripts/mihoyo/zzz/zzz.integration.test.js    # 真实脚本主体 + 假网络，跑完整签到流程
node userscripts/mihoyo/zzz/zzz.cookie.test.js         # 抓取边界：只存该存的字段
```
