# 小米商城抽奖

Source: https://github.com/MaYIHEI/paperclip/tree/main/app/milottery

Mirrored files:

- `milottery-loon.plugin`: Single Loon plugin entry. It includes MITM, cookie capture, and the daily cron task.
- `milottery.js`: Loon/Surge/Quantumult X compatible script. It captures Xiaomi lottery activity data on request and runs tasks/draws on cron.

Recommended Loon plugin:

```text
https://raw.githubusercontent.com/cth123456/script-library/main/userscripts/milottery/milottery-loon.plugin
```

Cookie capture is controlled by the plugin argument `Cookie 抓取`. Enable it when refreshing activity data, then turn it off after the success notification if you do not want request interception to stay active.

Notes:

- Keep this script for your own account only.
- Cookie data is a login credential. Do not share screenshots or logs containing it.
- If Xiaomi changes activity APIs, refresh from upstream and re-test.
