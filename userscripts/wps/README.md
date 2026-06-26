# WPS Office Daily Tasks

Source: https://github.com/MaYIHEI/paperclip/tree/main/app/wps

Mirrored files:

- `wps.cookie.js`: Loon/Surge/Quantumult X request script for capturing `wps_sid` from WPS activity requests.
- `wps.js`: Daily cron script for WPS sign-in and welfare-center tasks.

Loon example:

```ini
[MITM]
hostname = personal-act.wps.cn

[Script]
http-request ^https:\/\/personal-act\.wps\.cn\/activity-rubik\/activity\/page_info tag=WPS Cookie, script-path=https://raw.githubusercontent.com/cth123456/script-library/main/userscripts/wps/wps.cookie.js, requires-body=false, img-url=https://raw.githubusercontent.com/MaYIHEI/pin/refs/heads/main/app/wps.png

cron "0 10 * * *" script-path=https://raw.githubusercontent.com/cth123456/script-library/main/userscripts/wps/wps.js, tag=WPS签到, img-url=https://raw.githubusercontent.com/MaYIHEI/pin/refs/heads/main/app/wps.png, enable=true
```

Notes:

- Keep this script for your own account only.
- `wps_sid` is a login credential. Do not share screenshots or logs containing it.
- If WPS changes activity APIs, refresh from the upstream source and re-test.
