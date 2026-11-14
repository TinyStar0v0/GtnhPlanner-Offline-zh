# 代码结构

这是上游 `gtnh-factory-flow` 的中文改造版。上游本身已经按领域分目录，改造时**没有大改原有结构**——
因为那会让后续同步上游变得几乎不可能。改动集中在三个地方，都有明确标注。

## 顶层

```
gtnhplanner-zh/
├─ start.cmd / setup.cmd / stop.cmd   用户入口（双击就能用的三个）
├─ README.md                          中文说明（首页）
├─ NOTICE.md                          第三方声明与许可证
├─ PUBLISH.md                         发布到 GitHub 的步骤
├─ docs/                              文档
├─ scripts/                           本地脚本（见下）
├─ public/                            静态资源；datasets/ 是本地配方数据（不入库）
├─ src/                               应用源码（Next.js App Router）
└─ tools/                             上游的数据管道与审计工具（未改动）
```

## scripts/

```
scripts/
├─ data/        从 gtnhplanner.com 拉数据（不入库的数据靠它们补齐）
│  ├─ fetch-dataset.mjs     数据清单、资源索引、配方整包
│  ├─ fetch-shards.mjs      1112 个配方分片
│  └─ fetch-icons.mjs       5.75 万张物品图标（断点续传）
├─ release/     发布到 GitHub 用（不是日常运行需要的）
│  ├─ publish.cmd           首次发布：init / commit / 加远程 / push
│  └─ push.cmd              之后推送；支持 `push.cmd <token>`
├─ launch.mjs   启动前自检（Node 版本、依赖、数据），失败原因写 scratch/logs/start.log
├─ serve.mjs    在当前进程里跑 Next（不用 CLI，避免另起子进程）
└─ bootstrap-node.ps1  没装 Node 时自动下载便携版到 .tools/node
```

## src 的领域划分

上游的目录是按功能切的，看目录名就知道该去哪找：

| 目录 | 内容 |
|---|---|
| `src/app/` | 路由与接口。`api/dataset/` 是**我们改的**：原来的 `[versionId]` 动态路由改成固定路径 + `version` 查询参数 |
| `src/components/flow/` | 画板：卡片、连线、自动布线、布局（最大的模块） |
| `src/components/chrome/` | 浏览器外壳：顶栏、标签页、设置、分享菜单 |
| `src/components/inspector/` | 右侧详情面板 |
| `src/components/nei/` | NEI 风格的物品格、tooltip、配方预览 |
| `src/components/pool/` | 调配表（Pool） |
| `src/components/library/` | 方案库（本地方案、收藏、文件夹） |
| `src/components/tasks/` | 任务板 |
| `src/lib/solver/` | LP 求解器、配方账本、并发与瓶颈判定 |
| `src/lib/machines/` | 机器数学：超频、并行、各机器的特殊行为 |
| `src/lib/model/` | 领域模型：资源、物品/流体、分区、画板 |
| `src/lib/power/` | 发电与耗电 |
| `src/lib/datasets/` | 数据集的浏览器端加载与查询 |
| `src/lib/server/` | 服务端：数据集查询、缓存、静态文件 |
| `src/lib/i18n/` | **我们加的**：全部汉化词库与查表逻辑 |
| `src/store/` | Zustand 状态（方案、设计、任务） |

## src/lib/i18n/（汉化）

```
i18n/
├─ index.ts            t() / tRecipeMap()，界面文案查表
├─ names.ts            tName()：整名 → 材料+形态组合 → 退回英文
├─ names.zh.json       3.36 万条英中对照（主体）
├─ materials.zh.json   8636 条材料名（从词表反推，供组合用）
├─ recipe-maps.zh.json 185 个配方类型名
├─ aspects.ts          69 个神秘时代要素
├─ tooltips.ts         tooltip 的规则翻译 + 高频整句
└─ localize.ts         服务端统一换名：displayName / 配方名 / tooltip
```

## 加代码该放哪

- 新的界面文案：写进 `src/lib/i18n/ui.zh.json`，代码里用 `t("...")`
- 新的物品/机器译名：写进 `names.zh.json`（或补 `materials.zh.json` 让它自动组合）
- 新的配方类型：`recipe-maps.zh.json`
- 数据接口：`src/app/api/dataset/`，服务端逻辑放 `src/lib/server/`
- 不要改动 `src/lib/{solver,machines,model,power}` 的既有逻辑——那是上游的核心算法，
  改了就很难再同步上游。
