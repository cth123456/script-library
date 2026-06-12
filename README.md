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
- 类型：Safari Stay 完整 BewlyCat 首页用户脚本
- 范围：只在 Bilibili 根首页运行完整 BewlyCat；视频、番剧、搜索、空间等页面保持 Bilibili 原版
- 隔离：离开首页时强制完整页面跳转，避免 BewlyCat 运行环境进入视频详情页
- 性能：单文件本地执行，不再远程下载 payload，不使用自动刷新恢复
- 上游项目：[shiinayane/BewlyCat-Safari](https://github.com/shiinayane/BewlyCat-Safari)
- 基于版本：BewlyCat Safari `1.6.7`，Stay 脚本版本 `2.3.0`
- 使用提示：请停用旧 BewlyCat Safari 扩展及旧版 Stay 脚本，避免重复注入
- 授权：遵循 [`BEWLYCAT-LICENSE.txt`](userscripts/bilibili/BEWLYCAT-LICENSE.txt)，仅限个人、学习和非商业用途

## 说明

- 仓库中的稳定文件名不会随版本变化，便于使用固定 Raw URL。
- 网站结构或接口发生变化后，脚本可能需要同步更新。
- 请遵守脚本来源网站的服务条款及所在地法律。
