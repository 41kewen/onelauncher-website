本页记录网站文档的源码依据、核对范围、素材来源和前端依赖。

## 源码快照 {#snapshot}

- 目标仓库：[lnetface/OneLauncher](https://github.com/lnetface/OneLauncher)。
- 核对提交：[`507e3b7cddf19d6c9a720dd229ab191c34992faf`](https://github.com/lnetface/OneLauncher/tree/507e3b7cddf19d6c9a720dd229ab191c34992faf)。
- 提交日期：2026 年 11 月 16 日；提交说明：“完善了一些问题和控制台模式”。
- 本次网站文档核对日期：2026 年 11 月 17 日。
- 源码中的版本常量：`1.6.1.2`。这个常量不等同于已经核实的最新 Release 标签。
- 网页核实的最新 Release：[v1.6.1.0](https://github.com/lnetface/OneLauncher/releases/tag/v1.6.1.0)，仅列 Windows EXE 附件；未下载或运行该二进制。Release 版本比本文源码快照早，功能可能有差异。

本次阅读 README、`docs/AI_Instruction`、相关 `docs/AI_Generated`、发布配置与真实 C# / AXAML 实现。使用方法追踪了页面按钮 → ViewModel → 核心服务；开发文档追踪了入口、初始化、管理器、任务事件、命令行和发布配置。

**没有实际运行启动器、Microsoft 登录、Minecraft 下载或联机。**源码核对能够说明当前代码路径，不能取代所有平台、账号、网络与游戏版本上的运行验证。仓库旧 AI 文档中的测试结果不算本次网站任务的测试记录。

## README 与当前实现的差异 {#readme}

README 说明了项目目标，但部分内容与当前代码不一致：

| README / 旧文档内容 | 本网站处理 |
| --- | --- |
| 克隆和 Windows 一键安装仍指向 `zhweaa` | 使用 `lnetface` 仓库地址；当前快照没有该安装脚本，不提供远程脚本一键执行命令。 |
| `OneLauncher.Core.Net` 仍出现在目录结构 | 用真实的 `OneLauncher.Core/DefaultComponent` 及 `Services` 说明当前结构。 |
| `docs/UI_FI.md` 与 `Welcome.md` 路径 | 导向实际存在的 `docs/AI_Generated` / `docs/Old` 文档，而不是失效链接。 |
| 模组、资源包和光影统称在线资源 | 以 UI 的模组、光影、整合包三个类别为准；资源包可手动放置，不承诺检索入口。 |
| 泛称 Yggdrasil 外置登录 | 说明当前 UI 固定 LittleSkin；核心协议能力和 UI 可配置性分开描述。 |
| 默认自动 Java / 全镜像竞速 | 说明 Java 要勾选，默认官方源，竞速为官方源加一个选定镜像。 |

工作区另有指向旧仓库的启动器副本，带有本地改动。本次使用独立官方快照，不把那些未提交修改当作官方项目最新版本，也没有更改它们。

## 素材与设计 {#assets}

### 背景

主页使用用户提供的 Minecraft 森林湖畔图片。我们保留原始文件，另生成 WebP 的多尺寸副本及 JPEG 回退，避免首屏下载不必要的大文件。

原图 SHA-256：

```text
876b39365e0548c3d80a4a1cc9020ba3ac9969917ba3fd6ddb7e64904157f1b8
```

### 图标与截图

启动器图标来自仓库 `OneLauncher/Assets/window-logo.ico`，截图来自 `docs/assets/screenshots`。首页注明截图来源，实际界面以下载版本为准。截图中的第三方图片、内容以及用户背景的公开使用权，需要由维护者在正式部署前确认。

### 设计参考

以 [SJMCL 官网](https://mc.sjtu.cn/sjmcl/) 的信息组织为参考：清楚的下载、文档、功能和项目入口。视觉上采用大字号、大片留白、场景图片和通透玻璃层次，呼应 Apple Vision Pro 的设计语言；没有复制 SJMCL 或 Apple 的源代码、图标、商标与摄影素材。

## 前端依赖与离线行为 {#frontend}

- GSAP `3.14.2` 与 ScrollTrigger 来自 npm 包的浏览器发行版本，已随静态网站本地打包，不从第三方 CDN 运行加载。使用 [GSAP Standard License](https://gsap.com/community/standard-license/)，保留版权头。
- `markdown-it 14.1.0` 是构建期依赖，按 MIT License 使用，不在浏览器执行；生成的是完整 HTML 文档。
- 主题默认遵从系统。手动选择保存在浏览器本机 `localStorage`，切回系统配色可恢复跟随；存储受限时仍可以在当前页面切换。
- 文档正文、目录、锚点与下载链接即使没有 JavaScript 也可使用。全文搜索需要 JavaScript，但它只读取本地静态索引，不向服务器上传搜索词。
- 减弱动态效果开启时不执行空间移动动画。GSAP 未加载也不会把内容留在隐藏状态。
- 下载与项目按钮会打开 GitHub。可用文件与下载状态以 GitHub 发布页为准。

## 可核查入口 {#references}

- [桌面入口](https://github.com/lnetface/OneLauncher/blob/507e3b7cddf19d6c9a720dd229ab191c34992faf/OneLauncher.Desktop/Program.cs)
- [初始化与路径](https://github.com/lnetface/OneLauncher/blob/507e3b7cddf19d6c9a720dd229ab191c34992faf/OneLauncher.Core/Global/Init.cs)
- [核心服务与管理器](https://github.com/lnetface/OneLauncher/blob/507e3b7cddf19d6c9a720dd229ab191c34992faf/OneLauncher.Core/Global/UnitedCore.cs)
- [资源安装服务](https://github.com/lnetface/OneLauncher/blob/507e3b7cddf19d6c9a720dd229ab191c34992faf/OneLauncher.Core/Services/ResourceInstallerService.cs)
- [账户登入界面逻辑](https://github.com/lnetface/OneLauncher/blob/507e3b7cddf19d6c9a720dd229ab191c34992faf/OneLauncher/ViewModels/Panes/UserModelLoginPaneViewModel.cs)
- [命令行分发](https://github.com/lnetface/OneLauncher/blob/507e3b7cddf19d6c9a720dd229ab191c34992faf/OneLauncher.Console/boot.cs)
- [GitHub Actions](https://github.com/lnetface/OneLauncher/blob/507e3b7cddf19d6c9a720dd229ab191c34992faf/.github/workflows/dotnet-desktop.yml)

若发现网站描述与新版本不一致，请提供对应版本或提交编号。
