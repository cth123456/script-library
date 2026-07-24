# 顺丰速运签到

Source attachment: `顺丰快递签到任务 2.js`

The original script header points to a Sliverkiss gist URL that now returns 404, so this repository mirrors the attached script and wraps it as a single Loon plugin.

Recommended Loon plugin:

```text
https://raw.githubusercontent.com/cth123456/script-library/main/userscripts/sfexpress/sfexpress-loon.plugin
```

Usage:

1. Install the Loon plugin and enable MITM for `mcs-mimp-web.sf-express.com`.
2. Keep `Token 抓取` enabled, open the SF Express mini program, enter `我的`, then open the coupon/share redirect page to refresh token. The plugin captures `https://mcs-mimp-web.sf-express.com/mcs-mimp/share/...` responses.
3. After the token success notification, `Token 抓取` can be turned off.
4. The cron runs at `08:51` and `21:51` daily.

Notes:

- Token/Cookie data is account credential material. Do not share logs/screenshots containing it.
- This mirror fixes the dead upstream script URL. If SF changes activity APIs, the obfuscated script logic itself may still need an upstream update.
