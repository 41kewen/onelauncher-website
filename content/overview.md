OneLauncher 是面向 **Minecraft Java 版** 的跨平台桌面启动器，提供版本安装、独立实例、账户和资源管理。

> 本文档依据官方仓库 2026 年 11 月 16 日提交 `507e3b7`，于 11 月 17 日核对。实际界面、功能和可用发布产物，以你下载的版本为准。

## 项目定位 {#project}

项目的目标来自 README：“轻量、快速、少配置的 Minecraft 启动器”。当前实现基于 .NET 10 与 Avalonia，核心代码负责下载、安装、认证、Java、资源与启动，桌面界面负责把这些能力组织为可操作的页面。

README 中的“轻量、快速”是项目目标。本网站未测量启动耗时、下载加速百分比或内存占用，也未统计用户数量。

- [官方 GitHub 仓库](https://github.com/lnetface/OneLauncher)
- [查看发布与下载](https://github.com/lnetface/OneLauncher/releases/latest)
- [开始阅读使用指南](guide.html#first-launch)
- [查看开发与贡献文档](developers.html)

## 当前可以做什么 {#capabilities}

| 能力 | 当前实现与边界 |
| --- | --- |
| 游戏版本 | 安装 Mojang 版本；按需要选择 Fabric、Quilt、NeoForge、Forge（预览）。具体支持情况依赖上游版本。 |
| 独立实例 | 分开管理版本与游戏数据；实例可命名、绑定账户、设置标签、复制和启动。 |
| 账户 | Microsoft 正版认证；LittleSkin 外置登入和本机离线身份受配置开关控制。 |
| Java | 下载时可勾选自动安装匹配 Java；也提供手动安装运行时与 JVM 配置。 |
| 资源 | 通过 Modrinth 检索模组、光影包和整合包；支持推荐模组。当前检索页面没有资源包类型。 |
| 导入 | 导入 PCL2 单个版本目录，或 Modrinth `.mrpack` 整合包。安装器可能需联网补全文件。 |
| 下载 | 默认官方源，可选择官方 + 一个镜像竞速；SHA-1 校验、任务进度和失败文件重试。 |
| 服务器 | 收藏服务器并绑定本地实例；Windows 上可以使用 MCT 联机助手。 |
| 命令行 | 安装版本、导入整合包、快捷启动、加入收藏服务器；提供平台相关内存工具，需了解系统范围副作用。 |

当前 UI 不支持配置任意外置认证服务器地址或在线检索 CurseForge 资源，也不会自动安装光影渲染模组。MCT 联机仅支持 Windows，Forge 仍为预览支持，不能保证所有版本兼容。

## 支持的平台 {#platforms}

桌面代码面向 Windows、Linux 与 macOS。不同平台的认证方式与发布依赖并不完全一样：

- **Windows**：支持系统 WAM Microsoft 登录，也可以切换浏览器登录；MCT 联机属于 Windows 专属能力。
- **Linux / macOS**：Microsoft 登录使用系统浏览器，不支持 Windows WAM 或 MCT 接口。
- **运行环境**：NativeAOT、自包含 JIT 和框架依赖发布包的要求不同。应用是否需要另装 .NET Runtime，应阅读具体发布说明；Minecraft 游戏仍然需要兼容 Java。
- **架构**：按 x64、arm64 等实际文件名选择。构建配置存在某个目标，不代表该目标一定已有可用 Release。

截至 2026 年 11 月 17 日，最新发布 [v1.6.1.0](https://github.com/lnetface/OneLauncher/releases/tag/v1.6.1.0) 只有 Windows `OneLauncher.Desktop.exe` 二进制附件，没有 Linux/macOS 二进制文件。网站下载按钮打开官方 GitHub Releases；其他平台可以参考[开发环境与本地运行](developers.html#environment)，或向维护者反馈。源码压缩包不是已编译的桌面应用。

## 版本、实例和账户 {#concepts}

### 版本

一个已安装的 Minecraft 基础版本以及它已有的加载器能力。版本与启动元数据由版本管理器维护。

### 实例

实例有自己的名称、目录、模组、存档、配置、标签和默认账户。多个实例可以基于相同的基础版本，彼此保留独立游戏数据。

### 账户

启动时使用的玩家身份。实例可以指定自己的账户，也可以引用全局默认账户。离线身份不会赋予你 Minecraft Java 版权益，也不能替代正版服务器的认证。

测试不同模组组合前，建议先复制实例，不要直接修改常用存档。删除实例没有内置撤销功能；请先备份。

## 开源、社区与法律信息 {#community}

OneLauncher 持续开发中。README 列出了 GitHub Issue、作者联系 QQ `1826379500` 与交流 QQ 群 `897655022`。提交问题时，请附上版本、系统、复现步骤和脱敏日志。

项目 README 和服务条款声明采用 Apache 2.0。本次参考快照没有独立 LICENSE 文件，涉及再分发时请结合维护者的许可说明确认，不把这个缺项解释为另外一种授权。

- [官方 README](https://github.com/lnetface/OneLauncher/blob/507e3b7cddf19d6c9a720dd229ab191c34992faf/README.md)
- [服务条款](https://github.com/lnetface/OneLauncher/blob/master/Terms_of_Service.md)
- [隐私声明](https://github.com/lnetface/OneLauncher/blob/master/Privacy_Policy.md)
- [MinecraftConnectTool](https://github.com/MCZLF/MinecraftConnectTool)

OneLauncher 与本网站并非 Minecraft 官方产品，与 Mojang 或 Microsoft 没有从属关系。第三方服务、资源与商标归各自权利人所有。网站没有账户表单、分析统计或云端搜索；主题选择只在本机保存，文档搜索使用随网页附带的静态索引。

## 相关文档 {#next}

1. [第一次启动](guide.html#first-launch)：添加账户、安装版本和 Java、启动游戏。
2. [实例与资源](guide.html#instances)：管理实例、模组和整合包。
3. [开发与贡献](developers.html)：开发环境、调用链和工程规范。
4. [文档来源](sources.html)：源码依据、素材来源和设计参考。
