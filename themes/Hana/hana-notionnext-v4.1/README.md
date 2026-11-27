# 花笺 Hana · NotionNext 主题适配包 V4.1

基于先前 V4 原型改为 React / Next.js Pages Router 主题。保留粉色、可爱小赖字体、首页四卡片、AI 星轨、移动端底部导航、侧栏与共享元素动效。**不是整个 NotionNext 仓库，也不是一套已通过你的 Netlify 部署验证的成品**。请在现有项目的独立分支安装。

## 本次新增：全站字体切换

打开右上角外观设置 → 字体，在「小赖字体」「山海夏日烟火」「系统字体」之间切换。
选中即全站生效，选择记录保存在访客当前浏览器；刷新、栏目跳转及恢复默认背景时保留字体选择。
字体预览只展示当前选择。代码块仍使用等宽字体。站长默认字体可以在 `themes/hana/config.js` 中设置 `HANA_DEFAULT_FONT`：
`xiaolai`（原版默认）、`shanhai` 或 `system`。

### 已安装 V4 的升级方法

在新版压缩包解压目录运行（先备份或提交原项目）：

```sh
node install-hana.mjs ../NotionNext --upgrade
cd ../NotionNext
node scripts/hana-install-shanhai.mjs "../ShanHaiXiaRiYanHuoW.zip"
node scripts/hana-check.mjs
```

`--upgrade` 只允许替换与原始 V4 内容哈希完全一致的文件，替换前将这些文件备份到项目 `.hana-backup/`。如果你改过配置或样式，脚本会中止并列出冲突文件，请手工合并（不要直接覆盖自己的配置）。升级不会覆盖已安装的字体或背景资源。无需为这次字体修改重新安装 AI 依赖。

### 安装用户提供的山海字体

原始压缩包 `ShanHaiXiaRiYanHuoW.zip` 中包含 `ShanHaiXiaRiYanHuoW-2.ttf`，字体内部名称为「山海夏日烟火 W」，版本 1.00.00。将自己的原始 ZIP 放在 NotionNext 项目旁边，在项目根目录执行：

```sh
node scripts/hana-install-shanhai.mjs "../ShanHaiXiaRiYanHuoW.zip"
```

也支持直接传入原始 TTF 的路径。安装脚本校验字体 SHA-256，从 ZIP 中只提取指定 TTF，保存到 `public/hana/fonts/ShanHaiXiaRiYanHuoW.ttf`。
本主题包不重新分发字体二进制。原始 ZIP 未附带具体授权协议；字体元数据指向字体厂商授权网站 `http://www.shanhaiziku.com`。
请自行确认公开网站/Web Font 授权后再提交字体文件和部署。字体未安装时界面会提示并回退系统字体。

## 1. 快速安装（尚未安装主题时）

准备：已有可正常构建的 NotionNext 项目，Node 版本沿用该项目要求（安装脚本需要 Node 18+），已有 Notion 数据源，无须把密码或 Token 交给任何人。

将本压缩包解压到 NotionNext 项目旁边，例如：

```
work/
  hana-notionnext-v4.1/
  NotionNext/
```

在解压目录运行：

```sh
node install-hana.mjs ../NotionNext
cd ../NotionNext
```

安装脚本只复制本包的 `themes/`、`public/`、`pages/`、`scripts/` 文件；如遇到不同内容的同名文件或 /blog、/tools 路由冲突会中止，不覆盖你的项目。

按原项目锁文件选择 **一种** 依赖安装命令（不要混用）：

```sh
# yarn.lock
yarn add @mlc-ai/web-llm@0.2.89
# 或 package-lock.json
npm install @mlc-ai/web-llm@0.2.89
# 或 pnpm-lock.yaml
pnpm add @mlc-ai/web-llm@0.2.89
```

安装本地小赖字体：

```sh
node scripts/hana-install-font.mjs
node scripts/hana-install-shanhai.mjs "../ShanHaiXiaRiYanHuoW.zip"
node scripts/hana-check.mjs
```

字体脚本从官方 GitHub Release 下载普通版 TTF 和 OFL 授权文本，保存在 `public/hana/fonts/Xiaolai-Regular.ttf`、`public/hana/fonts/OFL.txt`。下载仅在安装时发生，运行时浏览器从自己的站点加载该文件，无第三方字体 CDN。完整中文 TTF 较大。可以在自己的电脑按需转换成 WOFF2（保留 OFL 并更新 CSS 中 @font-face），但不要使用仅覆盖示例文字的子集，以免真实文章缺字。

若自动下载失败，打开 https://github.com/lxgw/kose-font/releases 下载非 Mono 普通版 TTF，另下载 https://raw.githubusercontent.com/lxgw/kose-font/master/OFL.txt 。手动执行：

```sh
node scripts/hana-install-font.mjs "/你的字体路径/Xiaolai-Regular.ttf" "--license=/你的字体路径/OFL.txt"
```

或手工将两个文件复制到目标目录并按上述名字保存。**压缩包未包含字体二进制；使用相应字体前必须安装。** 不要提交未获得授权的其他字体。小赖字体采用 SIL OFL 1.1。

## 2. 启用主题

在 Netlify 的 Site configuration → Environment variables 设置：

```
NEXT_PUBLIC_THEME=hana
```

如果 Notion Config 数据表里已有 `THEME` 项，也改成 `hana`，以免覆盖环境变量。若开启了主题切换挂件，可以关闭 `THEME_SWITCH`，保留 Hana 自带的深浅色按钮。无需覆盖 `blog.config.js`、`next.config.js`、`netlify.toml`、`_app.js` 或原有环境变量。

本地可在 `.env.local` 添加 `NEXT_PUBLIC_THEME=hana`（保留已有值）；或在开发分支暂时改 Notion Config。请继续使用原项目已有的 `NOTION_PAGE_ID` 及其他环境变量。

按原项目运行 `yarn dev`（或 `npm run dev` / `pnpm dev`），检查 `/`、`/blog`、`/category`、`/archive`、`/tools`，以及任意真实文章。再执行原项目的 build 命令。必须通过构建后再将新增文件及依赖锁文件、已安装的字体和 OFL 提交 GitHub，推送触发 Netlify。不要提交 `.env.local`、`node_modules`、密钥。

此包基于官方公开 main 的 Pages Router、`DynamicLayout` / `LayoutBase`、`fetchGlobalAllData`、`siteConfig`、`useGlobal`、`NotionPage` 接口。不同版本可能需要适配。本包不修改 NotionNext 核心文件；`/api/hana/catalog` 需要 Next.js server/Netlify Next.js runtime，不适用于纯 `next export`。若 Netlify 现有项目使用纯静态导出，需先调整部署方式，不能直接使用此 API。

## 3. 文件说明

```
themes/hana/
  index.js                 React 布局、页面与共享组件
  config.js                配色、站名、首页、AI、背景配置
  style.js                 引入同源 CSS
  art.js                   自绘花卉、封面、AI 光球 SVG
  data.js                  数据适配与公开字段筛选
  tools.json               站长公开工具收藏
  fonts.js                 字体选项与偏好校验
  components/
    Appearance.js          背景上传、预设、IndexedDB
    Assistant.js           WebLLM 模型加载、流式对话、站内上下文
public/hana/
  hana.css                 V4 样式（限定 theme-hana）
  fonts/                   本地字体目录（安装后包含小赖、山海 TTF 及对应授权）
  backgrounds/             自定义背景资源
pages/blog/index.js        博客独立列表
pages/tools/index.js       工具独立页面
pages/api/hana/catalog.js  获取已发布文章目录与可公开链接
scripts/
  hana-install-font.mjs    下载/安装小赖字体及授权
  hana-install-shanhai.mjs 从原始 ZIP/TTF 导入山海字体
  hana-check.mjs           安装文件检查
install-hana.mjs           安全复制/原版升级安装器
preview-v4.1.html          独立原型（示例数据）
```

首页不展示文章列表。分类、标签、归档、文章详情和 404 接入 NotionNext 的原路由。博客页和工具页新增固定 URL，请确保 Notion 中未使用相同 slug。API 只输出已发布 Post 的必要元数据以及公开的工具链接，不输出完整 blockMap、密码哈希或配置。带密码的 Post 只保留标题等公开元数据，摘要/封面不提供给 AI。真实文章仍使用 NotionNext 的 `NotionPage` 和 `validPassword`，不另写认证。

## 4. 修改自己的内容

`themes/hana/config.js`：
- `HANA_NAME`：站点显示名。默认花笺。
- `HANA_DEFAULT_FONT`：站长默认字体，可选 xiaolai / shanhai / system。
- `HANA_HERO_TITLE`、`HANA_HERO_DESCRIPTION`：首页标题、简介。
- `HANA_HERO_COVER`：可指定 `/hana/backgrounds/hero.webp`。
- `HANA_USE_NOTION_COVER`：默认 false 保留手绘花卉；true 则在未配置 hero 封面时使用 Notion 封面。
- `HANA_BACKGROUND_URL`：站长背景文件，例如 `/hana/backgrounds/background.mp4`。
- `HANA_BACKGROUND_TYPE`：image 或 video。
- `HANA_AI_ENABLED`：是否显示 AI。
- `HANA_AI_MODEL`：默认 Qwen2.5 0.5B 量化模型。
- 颜色、文章目录、分享、评论、公告开关可在配置中修改。

`AUTHOR`、`BIO`、`AVATAR` 使用原 NotionNext 站点配置。文章全部由原 Notion 数据库维护。工具收藏可修改 `themes/hana/tools.json` 后部署；也读取 NotionNext 的 `allPages` 中分类/标签为“工具”的已发布且未加密 Page/Post（兼容存在 Link 类型的版本）；将该行的 slug 设置为 HTTP/HTTPS 外部网址，或填写版本支持的外链字段。内部文章不会被误当成外链。如果版本不支持外链字段，JSON 收藏仍可使用。访客点击“添加工具”是个人本地收藏，不会改写 Notion 数据库。

站长默认背景放 `public/hana/backgrounds/`，自行上传背景则仅存储于当前浏览器，支持 JPG/PNG/WebP/GIF/AVIF/MP4/WebM，最多 30 MB。背景和 AI 动画遵循减少动态效果设置。

## 5. AI

安装了 `@mlc-ai/web-llm` 后，访客点击「启用本地 AI」才开始下载模型。首次需联网下载数百 MB，支持 WebGPU 的 Chrome/Edge 等浏览器，HTTPS 或 localhost。模型由上游提供，未打包模型权重。推理在设备本地运行，无需付费 API Key；小模型质量和设备兼容性有限。公开文章标题摘要、工具和当前公开文章文本作为本地上下文（不是全站向量检索）。密码文章不应进入 AI 上下文。此处未完成真实设备下载/推理测试。

## 6. 已知限制与验收

- 这是完整的主题源文件及安装脚本，不是复制进任意版本就保证成功的包。未取得你的原仓库、锁文件、Notion 数据和 Netlify 构建日志，未执行真实项目 `next build`。
- 字体二进制须按第 1 节安装；检查 Network 中选中字体对应的 `/hana/fonts/Xiaolai-Regular.ttf` 或 `/hana/fonts/ShanHaiXiaRiYanHuoW.ttf` 返回 200，且无字体 CDN 请求。
- `/api/hana/catalog` 只为站点目录提供数据。服务失败时侧栏可能仅有当前页文章；归档页仍优先使用 NotionNext 原生 `archivePosts`。
- 导航采用 View Transitions API，旧浏览器降级为入场动画。动态路由实际过渡依赖项目自身渲染/加载速度，不能保证与单文件原型完全相同。
- 评论/分享沿用全局组件，需要原项目相应插件已配置。额外的官方主题切换预览 manifest 未注册（私人主题不必向上游提交）。其他产品/社区型特殊路由不在本次五栏目范围内。
- 默认路径基于域名根目录部署（Netlify 常用方式）。如果使用自定义 basePath，需要同步调整 CSS 字体与站点媒体 URL。

验收：实际 Notion 数据 → 分类数量 → 月历点击日期 → 博客筛选 → 文章密码验证 → 工具收藏 → 背景上传刷新 → 深浅色 → 手机布局 → 三种字体切换及刷新保持 → AI 模型加载。先在本地或 Netlify Deploy Preview 测试，确认后再合并生产分支。

参考：
- https://github.com/notionnext-org/NotionNext/blob/main/docs/developer/THEME_MIGRATION_GUIDE.zh-CN.md
- https://github.com/lxgw/kose-font
- https://github.com/mlc-ai/web-llm

## 7. 独立原型

`preview-v4.1.html` 使用示例数据供比较布局。如果要直接在解压目录打开并预览真实字体，可先在该目录运行 `node scripts/hana-install-shanhai.mjs "原始 ZIP 路径"`，以及小赖字体安装脚本。此操作仅供本地预览。站点正式部署仍按上述步骤在 NotionNext 项目内安装。

V4.1 验证范围：原字体 ZIP 导入、升级备份与冲突保护均已在模拟项目通过；实际山海字体在独立原型中加载成功，已检查全站字体切换、模拟存储恢复和手机端外观设置。修复移动端顶部模糊滤镜导致底部导航遮挡设置按钮的问题。尚未在你的实际 NotionNext 仓库中构建。
