# Script Library

个人脚本分类仓库。

## Forward Widgets

### Hanime1

- 文件：[`forward-widgets/hanime/hanime.js`](forward-widgets/hanime/hanime.js)
- 类型：ForwardWidget 视频模块
- 版本：`1.2.0`
- 功能：按官网影片分类作为入口，进入分类后在右上角选择排序、时间范围、时长，支持搜索、详情和多画质播放资源
- 播放：从播放页和下载页双路提取 MP4，并附带播放请求头
- 内容提示：包含成人内容，仅供成年人使用

## Userscripts

### WPS Office Daily Tasks

- 文件：[`userscripts/wps/wps.js`](userscripts/wps/wps.js)
- Cookie 抓取：[`userscripts/wps/wps.cookie.js`](userscripts/wps/wps.cookie.js)
- Loon 插件：[`userscripts/wps/wps-loon.plugin`](userscripts/wps/wps-loon.plugin)
- 类型：Loon/Surge/Quantumult X 签到与福利中心任务脚本
- 功能：每日签到、打卡领会员、天天抽奖、会员试用申请、限量爆款领取、小程序打卡
- Loon 用法：推荐导入单个插件，`Cookie 抓取` 可在插件参数里单独开关
- 上游项目：[MaYIHEI/paperclip app/wps](https://github.com/MaYIHEI/paperclip/tree/main/app/wps)
- 注意：`wps_sid` 属于登录凭据，仅用于本人账号，不要公开日志或截图

### BewlyCat for Stay

- 文件：[`userscripts/bilibili/bewlycat-stay.user.js`](userscripts/bilibili/bewlycat-stay.user.js)
- 类型：Safari Stay BewlyCat 用户脚本
- 稳定版本：`1.6.6-stay.3`
- 首页：保留 BewlyCat 1.6.6 原版布局，并修复 Stay 延迟注入和 CSS 加载白屏
- 视频页：强制完整导航到哔哩哔哩原生详情页，不注入 BewlyCat
- 上游项目：[keleus/BewlyCat](https://github.com/keleus/BewlyCat)
- 基于提交：`eb2f273365158c867cc0da39902cc50813318518`
- 授权：遵循 [`BEWLYCAT-LICENSE.txt`](userscripts/bilibili/BEWLYCAT-LICENSE.txt)，仅限个人、学习和非商业用途

### Motrix Safari Download Bridge

- 文件：[`userscripts/downloaders/motrix-safari-bridge.user.js`](userscripts/downloaders/motrix-safari-bridge.user.js)
- 类型：Safari Stay 下载桥接脚本
- 用法：按住 `Option/Alt` 点击链接，或点击网页自带的下载链接
- 处理顺序：Motrix RPC 优先；连接失败、认证失败或任务被立即拒绝时自动改用 Safari 下载
- 兼容：按 Stay 2.9.20 的内置解析器和 GM API 实现验证，不使用 Stay 不支持的 `@connect`
- 配置：首次下载时输入 Motrix 设置中的 RPC 密钥，密钥仅保存于 Stay 本地

## 说明

- 仓库中的稳定文件名不会随版本变化，便于使用固定 Raw URL。
- 网站结构或接口发生变化后，脚本可能需要同步更新。
- 请遵守脚本来源网站的服务条款及所在地法律。
