# 绝区零米游社签到 Loon 插件

Source: https://github.com/lowking/Scripts/blob/master/mihoyo/zzz.js

This directory mirrors `zzz.js` and adds `zzz.cookie.js`, a Loon request/response capture helper that writes the persistent keys expected by the original script:

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
3. Open 米游社, enter 绝区零签到 page and 绝区零 community pages until the notification says the required parameters are complete.
4. Disable `Cookie 抓取` after capture if you do not want request interception to stay active.
5. Keep `定时签到` enabled for the daily 00:10 cron.

Notes:

- The original script says it was only tested on Surge. This wrapper only adds Loon capture and plugin packaging; it does not rewrite the original signing logic.
- 米游社分享任务和发帖任务默认关闭。你发来的日志里这两个接口返回 `invalid request`，所以插件默认只跑已确认可用的签到、浏览、点赞等任务。
- If cron runs but reports API risk/captcha or activity errors, that is upstream API behavior and needs a newer signing logic.
- Cookie values are credentials. Do not share logs or screenshots containing them.
