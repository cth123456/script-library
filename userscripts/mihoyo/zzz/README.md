# 绝区零每日奖励 + 米游社社区打卡 Loon 插件

Source: https://github.com/lowking/Scripts/blob/master/mihoyo/zzz.js

This directory mirrors `zzz.js` and adds `zzz.cookie.js`, a Loon request/response capture helper that writes the persistent keys expected by the original script.

It runs both supported sign-in paths:

- 绝区零每日奖励签到: `act-nap-api.mihoyo.com/event/luna/zzz`
- 米游社社区打卡: `bbs-api.miyoushe.com/apihub/app/api/signIn`

- `zzzUidKey`
- `zzzCookieKey`
- `zzzDfpKey`
- `zzzBbsCookieKey`
- `appVersionKey`

Recommended Loon plugin:

```text
https://raw.githubusercontent.com/cth123456/script-library/main/userscripts/mihoyo/zzz/zzz-loon.plugin
```

Capture flow:

1. Install the plugin and enable MITM for the listed hosts.
2. Keep `Cookie 抓取` enabled.
3. Open 米游社, enter the 绝区零每日签到 page. The capture script saves parameters and immediately tries to claim the daily reward.
4. Enter the 绝区零 community page until the notification says the community parameters are complete.
5. Disable `Cookie 抓取` after capture if you do not want request interception to stay active.
6. Keep `定时签到` enabled for the daily 00:10 cron.

Notes:

- The original script says it was only tested on Surge. This wrapper only adds Loon capture and plugin packaging; it does not rewrite the original signing logic.
- Opening the 绝区零每日签到 page now triggers an immediate daily-reward sign attempt after the required UID/Cookie/device fingerprint are available.
- 米游社分享任务和发帖任务默认关闭。你发来的日志里这两个接口返回 `invalid request`，所以插件默认只跑已确认可用的签到、浏览、点赞等任务。
- If cron runs but reports API risk/captcha or activity errors, that is upstream API behavior and needs a newer signing logic.
- Cookie values are credentials. Do not share logs or screenshots containing them.
