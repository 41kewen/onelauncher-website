# OneLauncher 官网

官网：https://olan.kewen.moe/

Minecraft Java 版启动器 OneLauncher 的独立官网源码。启动器项目：https://github.com/lnetface/OneLauncher

包含首页、项目介绍、使用指南、开发与贡献、来源与版本。文档依据启动器提交 `507e3b7cddf19d6c9a720dd229ab191c34992faf`，核对日期 2026-11-17。当前官网包含手机功能卡片布局修复。

## 本地构建

需要 Node.js 和 npm。

```sh
npm ci
npm run build
npm run check
node frontend-tests.mjs
npm run preview
```

预览 http://127.0.0.1:4178/。构建输出为 `dist/`，整体可部署到静态托管。

## 修改

- `site/index.html`：首页
- `site/assets/styles.css`：样式与响应式布局
- `site/assets/app.js`：主题、动效与搜索
- `content/*.md`：文档正文
- `build.mjs`：文档模板与静态生成

不要手工修改生成的 docs、搜索索引和 vendor 文件。构建会从 npm 依赖打包 GSAP，运行时无第三方 CDN。仓库不附带启动器源码快照，因此检查命令会明确跳过本地源码行号校验；网页链接和素材校验仍执行。

## 部署

Vercel 使用 Other 框架，运行 `npm run build`，输出目录 `dist`，配置见 `vercel.json`。正式域名为 `olan.kewen.moe`。

## 素材与许可

背景、启动器图标、界面截图与依赖说明见 `THIRD_PARTY_NOTICES.md`。没有账户表单、数据库或分析统计；下载按钮指向官方 GitHub Releases。网站并非 Minecraft 官方产品。
