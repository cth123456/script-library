# Script Library

个人脚本分类仓库。

## Forward Widgets

### Hanime1

- 文件：[`forward-widgets/hanime/hanime.js`](forward-widgets/hanime/hanime.js)
- 类型：ForwardWidget 视频模块
- 功能：中文官网标题、分类、搜索、详情和多画质播放资源
- 内容提示：包含成人内容，仅供成年人使用

## Userscripts

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
