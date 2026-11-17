这份文档面向希望修复问题、扩展功能或构建 OneLauncher 的贡献者。内容按 **2026-11-17** 阅读的官方仓库提交 `507e3b7` 核对，完整提交号为 `507e3b7cddf19d6c9a720dd229ab191c34992faf`。历史说明与当前实现不一致时，以源码和项目配置为准。

> **验证范围：** 本站编写时阅读了 README、docs、工程配置和调用链，没有执行下方启动器构建和 Native AOT 发布命令，也没有实际登录或下载游戏。下方命令根据源码与项目配置整理，运行结果仍需在相应环境中验证。

## 开发环境与本地运行 {#environment}

OneLauncher 使用 **C# / .NET 10、Avalonia、CommunityToolkit.Mvvm**。`global.json` 固定 SDK **10.0.402**，`rollForward` 为 `latestPatch`；只有 .NET Runtime 不能用于编译。所有工程通过 `Directory.Build.props` 继承 `net10.0`。当前 Avalonia 基础包变量为 12.1.4，桌面包 `Avalonia.Desktop` 明确引用 12.1.6，开发时沿用配置，不假定所有包版本相同。

在支持该 SDK 的 IDE 中打开解决方案，或在仓库根目录运行：

```powershell
git clone https://github.com/lnetface/OneLauncher.git
cd OneLauncher
dotnet --info
dotnet restore OneLauncher.sln
dotnet build OneLauncher.sln -c Debug
dotnet run --project OneLauncher.Desktop/OneLauncher.Desktop.csproj
```

最后一条命令**不带应用参数**时开启 GUI；桌面入口只要收到参数，就交给同一套 CLI 命令分发器处理。Java 是 Minecraft 的运行环境，.NET SDK 是启动器的编译工具，两者互不替代。编译无需先安装 Minecraft；验证游戏启动、账户与下载功能则需要匹配的 Java、有效配置和相应网络服务。

README 的部分 clone 和一键安装地址仍指向旧 `zhweaa` 仓库。新开发工作应以 `lnetface/OneLauncher` 为上游；不要继续传播旧安装脚本作为当前推荐入口。

## 当前工程结构 {#architecture}

```text
OneLauncher.Desktop/          桌面启动入口、平台配置、发布 profiles
OneLauncher/                  Avalonia UI
  Views/                      主窗口、页面、侧栏 AXAML
  ViewModels/Pages/           页面状态与命令
  ViewModels/Panes/           侧栏状态与耗时操作交互
  ViewModels/Panes/Factories/  侧栏 ViewModel 工厂
  Interfaces/                 页面与侧栏契约
  Styles/                     共用样式
  Assets/                     图标、图片与文本资源
OneLauncher.Core/
  Global/                     初始化、核心聚合、任务、日志、更新
  Global/ModelDataMangers/     持久化管理器与 JSON 源生成上下文
  Services/                   安装、资源、实例、用户与启动服务
  DefaultComponent/           默认下载器、账户、Java、启动、资源、MCT
  Minecraft/                  Mojang 元数据、版本与资源索引
  Helper/                     模型、平台工具、PCL2 导入
OneLauncher.Console/          独立 CLI，桌面参数模式复用相同命令
ConsoleTest/agent_test/        独立检查与实验工程
build/                        发布脚本、实验输出与清理工具
docs/                         约定、实现说明、历史参考与截图
.github/workflows/            三平台 AOT CI
```

README 提到的 `OneLauncher.Core.Net` 在这个提交中已经不存在。账户、Java、Modrinth、服务器与 MCT 默认实现现在位于 `OneLauncher.Core/DefaultComponent`。不要照旧目录新建另一份重复后端。

UI 规范实际位于 `docs/AI_Generated/UI_FI.md` 与 `UI_FI_Style.md`；旧架构介绍位于 `docs/Old/Welcome.md`。README 里的根 `Welcome.md`、`docs/UI_FI.md` 链接已过时。`docs/AI_Generated` 可解释代码用意，但其中的“已经验证”只对应历史任务，不代表当前提交仍通过相同检查。

## 核心数据与生命周期 {#data}

桌面启动先创建 `Init.InitTask`，主窗口等待初始化，注册页面 ViewModel 与侧栏工厂，再构建依赖注入容器。`Init.Initialize` 先读取配置、解析安装目录，注册共享下载器与 `UnitedCore`。`UnitedCore` 聚合账户、Java、游戏数据、版本列表、任务与业务服务。

`Init` 自述为兼容尚未改写的旧代码入口；新增业务优先通过 `UnitedCore` 与已有 `Services` 使用管理器，不要再创建一套全局账户、实例索引或下载状态。页面 ViewModel 在构造函数声明依赖；侧栏由工厂创建，工厂单例不意味着侧栏状态也应单例。每次新操作需要独立侧栏状态和正确释放事件订阅。

| 数据 | 默认位置与来源 |
| --- | --- |
| 启动器数据根 `BasePath` | 当前用户主目录下的 `OneLauncher` |
| 主配置 | `<BasePath>/config.json` |
| 账户配置 | `<BasePath>/playerdata/account.json` |
| 安装根 `InstalledPath` | 从 `OlanSettings.InstallPath` 解析，默认 `<BasePath>/installed` |
| Minecraft 根 | `<InstalledPath>/minecraft` |
| 版本索引 | `<GameRootPath>/versions/version_list.json` |
| 实例索引 | `<GameRootPath>/instance/instance.json` |
| Java 运行时 | `<InstalledPath>/runtimes/<Java major>/...` |
| 启动器错误日志 | `<BasePath>/logs/olan-error-<UTC>-<PID>-<random>.log` |

安装路径支持 `${OLAN_BASE_PATH}` 与 `${OLAN_APP_RUNNING_PATH}`。路径在启动时解析并固定，修改设置后需要重启。CLI 的 `dataPath:` 是**启动器配置根目录**，不是 Minecraft 根目录：CLI 读取该目录中的配置，再解析 `InstallPath`。

持久化必须走现有管理器。`BasicDataManager<T>` 用对应 `JsonTypeInfo<T>` 读写；保存先写随机临时文件并刷新，再替换目标文件，保存成功后发出 `OnDataChanged`。不要先更新 UI 为成功再等待保存，也不要绕开管理器并发修改 JSON 文件。

## 安装与启动调用链 {#flows}

**版本安装：** `DownloadPaneViewModel` 创建任务 → `DownloadInfo.Create` 生成下载配置和待建实例 → `VersionInstallerService.InstallNewVersion` → `DownloadMinecraft.MinecraftBasic` 下载/安装 → `VersionListManager.RegisterInstalledVersionAsync` 登记版本 → 页面保存游戏实例并设置默认项。

CLI 的安装命令复用同一下载配置与安装服务。选择多种加载器时分别创建独立实例，首个实例成为该游戏版本默认项，不是把互斥加载器混装到同一实例。推荐模组在基础实例创建后作为附加任务执行；附加任务失败会保留基础实例，但 CLI 返回非零状态。

**游戏启动：** `GameLaunchService.CreateLaunchService` 为本次启动建立独立任务 → `LaunchService.Play` 查找实例、准备配置与账户 → `LaunchCommandBuilder` 组合 classpath、Java、JVM、游戏参数和加载器策略 → `GameLauncher` 创建进程。

启动功能的扩展应复用这一链路。不要用硬编码命令绕过实例、Java 与账户检查，不要把可变 `LaunchService` 作为全局并发共享对象。命令构建成功不等于游戏进程正常运行；验证还应观察实际退出状态、工作目录、输出和依赖是否完整。

## 前端协作、任务与错误 {#conventions}

遵循 `docs/AI_Instruction/前端设计规范.md`：使用 `[ObservableProperty]` 和 `[RelayCommand]`；页面实现 `IPageHost`，侧栏实现 `IPaneHost`；复杂列表项用独立状态模型。页面注入侧栏依赖，侧栏通过回调影响页面，而不是硬查主窗口控件。

给用户看的耗时操作通过 `core.TaskManager.CreateTask("任务名称")` 创建任务。取消源取自任务的 `Token`，向下载、解析、安装等调用继续传递。进度用 `SetProgress`，成功用 `SetDone`，失败用 `SetFailed`；取消和失败必须保留真实终态，不仅替换提示文字。当前任务创建事件的准确名称是 **`OnTaskCreate`**。

下载/安装按钮触发的重工作在 ViewModel 按项目约定使用 `await Task.Run(...)`；UI 更新放到 UI 线程。任务中心订阅事件刷新，关闭/释放后解除订阅；不要用无界轮询代替正常事件契约。通知通过 `WeakReferenceMessenger` 的 `MainWindowShowFlyoutMessage` 发出，可附“点击打开任务中心”行为。

已知业务错误使用 `OlanException`，包含标题、上下文、`Warning / Error / FatalError`、原异常与可选重试方法；前端交给 `OlanExceptionWorker`。消息应说明正在做什么、失败的文件/目录/阶段和底层原因，不吞掉异常、不返回假成功。

当前 `OlanException` 构造函数已经调用 `UnitedCore.Log(this)`，会自动进入错误日志。旧日志实现文档里“尚未接入构造函数”的描述已经失效。日志按错误追加并关闭文件，展开原异常链；桌面启动阶段的致命错误仍可能写程序目录的 `crash_log.txt`。日志没有自动轮转和文本脱敏，维护者不得写入 token、密码、认证响应或未经审阅的启动参数。

## AOT 与序列化 {#aot}

项目要求保持 Native AOT 兼容。新增模型字段或 JSON 类型时，同时更新对应 `*.JsonModels.cs` 与 `[JsonSerializable]` 声明，调用源生成的 `JsonTypeInfo` 重载。主要上下文包括配置、账户、实例、版本列表与 Minecraft 元数据；Microsoft、Yggdrasil、Modrinth、整合包也有各自上下文。

避免反射扫描命令、运行时生成代码、任意对象反射序列化或依赖动态加载的方案。测试工程可以为隔离验证使用反射，但这不是生产实现可照搬的模式。

`build/PublishValidation.targets` 启用裁剪与 AOT 分析，并把相关问题视为错误。不要关闭检查器来制造“发布成功”。还原与发布必须使用一致的 profile、RID 和 AOT/裁剪属性；普通 restore 后直接 `--no-restore` 发布 AOT，可能缺少工具链，项目会主动拒绝。每种平台/编译模式用独立输出，防止旧 CoreCLR 文件混入原生包。

## 命令行接口 {#cli}

源码中的 `OneLauncher.Console` 是独立可执行工程；桌面入口收到参数时也调用相同 `Boot.RunBoot`。以下使用 `dotnet run`，**不假定下载渠道提供了独立 `OneLauncher.Console.exe`**。

### 参数规则

- 命令必须位于第一个参数；无需 `--console` 前缀。
- 后续参数采用 `key:value`，参数名不区分大小写，顺序任意；命令名按帮助文本准确书写。
- 仅按第一个冒号拆分，所以 Windows 盘符和值中的冒号会保留。
- 含空格时把整个参数加引号，例如 `"name:我的 Fabric"`。
- 重复参数、空值、未知选项、非法布尔值会拒绝；布尔值用 `true` / `false`，不是 `yes` 或 `1`。
- 旧的 `--quicklyPlay <id>`、`--joinServer <id-or-name>` 单位置参数形式仍兼容；新脚本建议使用具名参数。

```powershell
dotnet run --project OneLauncher.Console -- --help
dotnet run --project OneLauncher.Console -- --installGameVersion version:1.21.5
dotnet run --project OneLauncher.Console -- --installGameVersion version:1.21.5 fabric:true java:true
dotnet run --project OneLauncher.Console -- --installGameVersion version:1.21 fabric:true fabricVersion:0.18.3 "name:我的 Fabric"
```

### 安装版本

`--installGameVersion` 必须提供 `version:`。`fabric / forge / neoforge / quilt` 默认均为 false，未选择加载器时安装原版；可以同时选择多种，为各加载器分别创建实例。指定 `name:` 时，多实例自动附加载器名称。`fabricVersion:` 必须同时指定 `fabric:true`，且该 Minecraft 的元数据确实包含指定 Fabric 版本。

数值版本的入口限制与 UI 相同：Fabric / Quilt 从 Minecraft 1.14 开始，Forge 从 1.2 开始，NeoForge 从 1.20.2 开始。允许输入不等于每个历史版本已获实际兼容验证；Forge 仍应按预览支持理解。

| 参数 | 含义 | 默认 |
| --- | --- | --- |
| `fabricApi` | 同时安装 Fabric API | `true` |
| `quiltQsl` | 同时安装 QSL | `true` |
| `allowBetaNeoforge` | 允许 NeoForge Beta | `false` |
| `useRecommendedForge` | 优先 Forge 推荐版 | `true` |
| `java` | 本次安装匹配 Java | `false` |
| `recommendedMods` | 安装兼容推荐模组与依赖，需要至少一种加载器 | `false` |
| `name` | 实例名称 | 未指定 |
| `dataPath` | 启动器配置根，读取其中的 config.json | 用户目录下 OneLauncher |

推荐模组失败或取消时，已经安装的实例保留。自动化脚本需检查退出码，而不是看到一条“安装成功”就认为所有附加任务完成。

### 导入、快速启动与服务器

```powershell
dotnet run --project OneLauncher.Console -- --importPack "path:D:/Packs/pack.mrpack" "dataPath:D:/OneLauncherData"
dotnet run --project OneLauncher.Console -- --importPack "path:D:/Packs/pack-bundle.zip"
dotnet run --project OneLauncher.Console -- --quicklyPlay instance:实例ID
dotnet run --project OneLauncher.Console -- --joinServer "server:服务器名称"
dotnet run --project OneLauncher.Console -- --releaseMemory
```

`--importPack path:` 接受存在的 `.mrpack`，或**包含且仅包含一个 `.mrpack` 的 ZIP**。它只提取该整合包，不执行 ZIP 附带程序，结束时清理临时副本；这不等于支持任意 CurseForge/其他启动器 ZIP。导入按包清单安装游戏与加载器，再登记实例。

`--quicklyPlay instance:` 启动已登记实例，不创建账号或自动猜测实例名。`--joinServer server:` 查找收藏服务器的 UUID 或名称，使用其关联实例；关联实例不存在会明确失败。上述命令均可用 `dataPath:` 指向另一配置根。

`--releaseMemory` 不接受 `dataPath` 等额外参数。它并不是只释放 Minecraft 游戏进程：Windows 实现尝试调整系统文件缓存并削减其他进程工作集，可能因权限失败；macOS 执行系统 `purge`，其他平台当前直接完成而不操作。它不能作为通用 FPS 提升或无副作用优化承诺，不建议在首次使用时盲目执行。

### 进度、取消与错误

安装/导入输出当前阶段、文件计数与名称。交互终端里单文件的全部下载源失败时，可输入 `y` 只重试该文件；标准输入已重定向则结束本次安装，避免自动化任务等待人工输入。`Ctrl+C` 通过任务的取消令牌终止安装或推荐模组工作。

`Boot` 将异常写入 stderr：失败退出 **1**，取消退出 **130**；没有异常时默认 **0**。游戏启动命令的成功返回不证明游戏能长期正常运行。新增 CLI 功能在 `Commands/<Name>/` 建独立处理类，复用 `CommandArguments`、`CommandContext`、`InstallationTask`，显式添加 Boot 分发分支与帮助文本，不使用反射发现命令。

## 构建、发布与检查 {#build}

### 使用已有发布配置

项目提供 `WindowsAot / WindowsJit`、`LinuxAot / LinuxJit`、`MacOSAot / MacOSJit`。优先使用 profile，不混用相互冲突的 AOT、JIT 与单文件参数。

```powershell
# 在 Windows 上；AOT 脚本会下载并 SHA256 校验 LLVM-mingw 工具链
pwsh -File build/Publish-WindowsAot.ps1 -PublishProfile WindowsAot
pwsh -File build/Publish-WindowsAot.ps1 -PublishProfile WindowsJit
```

```sh
# 在对应平台执行
dotnet publish OneLauncher.Desktop/OneLauncher.Desktop.csproj -p:PublishProfile=LinuxAot --artifacts-path build/output/LinuxAot --disable-build-servers
dotnet publish OneLauncher.Desktop/OneLauncher.Desktop.csproj -p:PublishProfile=MacOSAot --artifacts-path build/output/MacOSAot --disable-build-servers
```

默认 RID：Windows `win-x64`、Linux `linux-x64`、macOS **`osx-arm64`，面向 Apple Silicon**。Intel Mac 不是当前 CI 默认目标，不应承诺已有 x64 Mac 包。发布输出位于 `OneLauncher.Desktop/bin/Release/net10.0/publish/<RID>/<aot-or-jit>/`。

AOT 是自包含原生程序。Windows profile 通过 StaticLink 做原生单文件，`PublishSingleFile=false` 不表示它依赖 .NET Runtime；Linux/macOS 需要保留随包原生库。JIT profiles 则开启自包含、单文件与裁剪。Linux AOT CI 安装 clang、zlib1g-dev；macOS/Windows 也需对应原生工具链。

### CI 与下载边界

`.github/workflows/dotnet-desktop.yml` 在 master push、目标 master 的 PR 或手动触发时运行 Windows、Ubuntu 22.04、macOS 15 三个独立任务。产物为对应 RID 的 AOT ZIP / tar.gz，上传 **Actions Artifacts，保留 14 天**。下载可能需要登录 GitHub，并先解 artifact 外层 ZIP。

**当前工作流不发布 GitHub Releases，不签名、不公证，也不生成 macOS .app/.dmg。** 不要把 Actions 产物描述成已正式发布并签名的安装包；完整发布目录中的原生库和可执行权限需保留。

### 选择相关检查

以下为已存在的检查工程入口，均应在仓库根运行，使用独立输出目录；本次文档编写未执行它们。

```powershell
# CLI 参数排列、错误拒绝、UI 默认值与核心安装选项一致性
dotnet run --project ConsoleTest/agent_test/OneLauncher.ConsoleTests -- build/console-doc-check-20261117
# 隔离配置、HTTP 替身的资源安装检查
dotnet run --project ConsoleTest/agent_test/OneLauncher.ResourceTests -- build/resource-doc-check-20261117
# 综合配置/UI 检查，先核对当前版本是否仍能构建
dotnet run --project ConsoleTest/agent_test/OneLauncher.RegressionTests -- build/regression-doc-check-20261117
```

综合检查的 README 还提供 `--notification-click`、`--shader-ui`、`--modpack-ui`、`--download-ui`、`--launch-directory` 子场景。真实 Java 工作目录检查需要 Java/Javac，并涉及诊断文件备份恢复；Forge 检查需要历史 installer fixtures，不是无需前置的一条通用测试命令。旧说明已记录综合检查有过时属性引用的可能性，应报告实际构建失败而非照抄历史通过结论。

特别注意：根 `ConsoleTest/Program.cs` 只是初始化后调用 `AutoUpdate.Update()`，会访问网络与默认数据，**不是整个项目的离线 regression 入口**。

实验按项目约定放到 `build/<任务名-日期>`；结束前定向预览清理范围，不做无差别清理：

```powershell
pwsh -File build/clean.ps1 -Task console-doc-check-20261117 -WhatIf
pwsh -File build/clean.ps1 -Task console-doc-check-20261117
```

构建通过不等于真实功能通过。登录、游戏下载、加载器安装、游戏进程启动、MCT 联机与三平台原生发布，应按改动范围分别记录实际输入、输出、退出状态与未覆盖项。

## 提交代码与贡献 {#contribute}

仓库没有独立的 CONTRIBUTING 模板；以下流程结合当前 AGENTS、源码约定与 CI 编写：

1. Fork 当前 `lnetface/OneLauncher`，从最新目标分支新建聚焦分支。
2. 阅读根 `AGENTS.md` 与 `docs/AI_Instruction/AGENT_MUST_READ_FIRST.md`，再阅读相关前后端规范；UI 修改还需两份 UI_FI 文档。
3. 先复现问题、追踪调用方，再最小修改；复用管理器、服务、任务中心和样式，不批量重构无关代码。
4. 保持接口/JSON 格式兼容；新增序列化类型同步源生成上下文，核对 AOT/裁剪影响。
5. 执行与改动相关的构建、离线检查和必要的真实行为验证；失败时报告原因，不把静态检查写成运行验证。
6. 在 `docs/AI_Generated/` 说明代码用意、调用逻辑、文件变化、扩展方法、实际验证和仍未覆盖的平台。
7. 只提交本任务变更，PR 指向 master，说明解决的问题、复现步骤、行为差异和兼容性风险。

Issue 建议附启动器版本/commit、系统/架构、Minecraft/加载器/Java 版本、复现步骤和脱敏日志。不要上传 `account.json`、认证缓存、token、密码或完整未审阅的启动命令。README 声明项目按 Apache-2.0 开源，但当前快照未见独立 LICENSE 正文；涉及再分发授权时应向维护者核实，不能由网站代替完整授权文本。

### 固定提交的参考入口

下面链接固定到本文核对的提交，不随最新分支更新。

- [贡献者必读与工程约定](https://github.com/lnetface/OneLauncher/blob/507e3b7cddf19d6c9a720dd229ab191c34992faf/docs/AI_Instruction/AGENT_MUST_READ_FIRST.md)
- [SDK 固定配置](https://github.com/lnetface/OneLauncher/blob/507e3b7cddf19d6c9a720dd229ab191c34992faf/global.json)
- [桌面入口与 CLI 分流](https://github.com/lnetface/OneLauncher/blob/507e3b7cddf19d6c9a720dd229ab191c34992faf/OneLauncher.Desktop/Program.cs#L11-L31)
- [核心初始化与数据路径](https://github.com/lnetface/OneLauncher/blob/507e3b7cddf19d6c9a720dd229ab191c34992faf/OneLauncher.Core/Global/Init.cs#L20-L88)
- [核心聚合与生命周期](https://github.com/lnetface/OneLauncher/blob/507e3b7cddf19d6c9a720dd229ab191c34992faf/OneLauncher.Core/Global/UnitedCore.cs)
- [UI 下载与实例登记调用链](https://github.com/lnetface/OneLauncher/blob/507e3b7cddf19d6c9a720dd229ab191c34992faf/OneLauncher/ViewModels/Panes/DownloadPaneViewModel.cs#L118-L210)
- [CLI 帮助与显式命令分发](https://github.com/lnetface/OneLauncher/blob/507e3b7cddf19d6c9a720dd229ab191c34992faf/OneLauncher.Console/boot.cs)
- [CLI 安装选项与默认值](https://github.com/lnetface/OneLauncher/blob/507e3b7cddf19d6c9a720dd229ab191c34992faf/OneLauncher.Console/Commands/InstallGameVersion/InstallGameVersionOptions.cs)
- [发布验证与 AOT 防误配置](https://github.com/lnetface/OneLauncher/blob/507e3b7cddf19d6c9a720dd229ab191c34992faf/build/PublishValidation.targets)
- [三平台 CI 与产物上传](https://github.com/lnetface/OneLauncher/blob/507e3b7cddf19d6c9a720dd229ab191c34992faf/.github/workflows/dotnet-desktop.yml)
