# GTNH Planner 中文自用版

把 [gtnhplanner.com](https://gtnhplanner.com)（上游源码：`jackwrichards/gtnh-factory-flow`，MIT）
改成只在自己机器上跑的中文版：配方数据整套下载到本地，界面与物品、机器、配方名换成简体中文，
移除社区、账户、云同步、反馈、统计。

## 起不来怎么办

双击 `start.cmd` 窗口一闪就关，是脚本在报错后停在「按任意键继续」，按键后正常退出——**闪退本身不是问题，前面那段提示才是**。常见四种：

| 窗口里的提示 | 原因 | 处理 |
|---|---|---|
| `Node.js not found` | 没装 Node 或不在 PATH | 装 [Node.js 18+](https://nodejs.org/)，重开窗口 |
| 缺 `node_modules` / `datasets.manifest.json` | 还没初始化 | 先双击 `setup.cmd` |
| 端口 3100 被占用 | 有别的程序占着 | 双击 `stop.cmd`，或把 `start.cmd` 里的 `3100` 改成 `3101` |
| 已经在跑 | 站点已在 `127.0.0.1:3100` 运行 | 正常，窗口关掉不影响 |

想看到完整报错：在文件夹的地址栏输入 `cmd` 回车，再执行 `start.cmd`，窗口就不会关。
每次启动的诊断也都会写进 `scratch\logs\start.log`。
## 第一次部署

```powershell
# 1. 装依赖 + 拉数据（约 400 MB，只需一次）
setup.cmd

# 2. 启动
start.cmd
```

`setup.cmd` 会依次：`npm install` → 拉配方数据集 → 拉 1112 个配方分片 → 拉 5.75 万张图标。
中途断了重跑即可，三个脚本都支持断点续传。

## 重启电脑之后怎么打开

1. 打开文件夹 `gtnhplanner-zh`（就是本文件所在的目录）
2. **双击 `start.cmd`**
3. 等窗口里出现「GTNH Planner 中文自用版已启动」和地址（第一次约 10 秒，之后更快），
   浏览器会自动打开 <http://127.0.0.1:3100>
4. **这个黑窗口别关**——关掉网站就停了。要停：按 `Ctrl+C`，或双击 `stop.cmd`

重复双击 `start.cmd` 不会报错：检测到已经在跑就直接开浏览器。

想开机自启：`Win+R` 输入 `shell:startup` 回车，把 `start.cmd` 的**快捷方式**拖进去。

## 跑起来

```powershell
cd gtnhplanner-zh
.\start.cmd
```

浏览器打开 <http://127.0.0.1:3100>。

`start.cmd` 只是设好临时目录再执行 `node scripts/serve.mjs dev 3100`。这里没用 `next dev`，
因为它的启动器要另起带管道的子进程；`scripts/serve.mjs` 在当前进程里跑 Next，效果一样。

第一次加载会现编译页面，约十秒；之后每屏首次打开还有一两秒编译时间。

想用官方脚本也可以（环境正常时）：

```powershell
npm install       # 本机已装好，可跳过
npm run dev       # http://localhost:3000
```

## 数据从哪来

`public/datasets/gtnh/` 下是 GTNH 2.9.0-RC-2 的完整数据集，从 gtnhplanner.com 公开的
`datasets.manifest.json` 拉下来的：

| 文件 | 内容 |
|---|---|
| `recipes-shards/shard-XXXX.json.gz` | 1112 个分片，共 27.8 万条配方本体（服务端按 shard 读盘） |
| `recipes.json.gz` | 同一份配方的整包（56 MB，留着备份/重建用） |
| `resource-index.json.gz` | 6.78 万条物品/流体/要素的名字、图标路径、主色 |
| `recipe-index.json.gz` | 配方的检索索引 |
| `recipe-lookup-index.json.gz` | 按配方类型/物品反查的索引 |

站点运行时不联网：`/api/dataset/*` 直接读这些文件。

## 中文化怎么做的

- **专有名词**：`src/lib/i18n/names.zh.json`，3.35 万条英中对照。三份来源合并：
  GTNH 官方中文本地化数据、`GTNewHorizons/GTNH-Translations` 里 170 多个模组的
  `en_US.lang`/`zh_CN.lang` 对照（`scratch/fetch-lang-pairs-*.mjs`）、手工补的 185 个配方类型名。
  服务端在 `/api/dataset/*` 的响应里把 `displayName` 换掉（`src/lib/i18n/localize.ts`），
  所以画板卡片、物品栏、搜索结果、提示框里的名字都是中文，前端不用再查表。
- **组合式译名**：整名查不到时按「材料 + 形态」拼（`names.ts` 的 `composeName()`），
  材料表 8636 条从现有词表反推（`scratch/build-materials.mjs`），另有石/木/燧石等非金属材料
  和要素兜底。形态表覆盖匠魂工具零件（`Tellurium Hammer Head` → 碲锤头、`Manyullyn Arrow Head`
  → 玛玉灵箭头）和 GT 的锭/粉/板/框架（`Zircaloy-4 Frame Box` → 锆锡合金-4框架箱）。
- **要素**：`src/lib/i18n/aspects.ts` 单独一张表。要素和物品重名（"Aer" 既是「风」
  也是物品「风之魔晶」），所以按 `kind === "aspect"` 查，注魔石这类带要素的方块也优先按要素拼
  （`Aer Infused Stone` → 风注魔石）。
- **界面文案**：`src/lib/i18n/ui.zh.json`（1504 条），键是代码里的英文字符串。
  `src/components/**` 里的 JSX 文本和 `title`/`label`/`placeholder` 等属性已经批量包成
  `t("...")`，查不到就原样显示英文。
- **中文检索**：`/api/dataset/resources` 收到中文查询时，先用 `names.ts` 的 `englishNamesFor()`
  反查成候选英文名（最多 8 个），逐个查完按 id 合并。输入「铁锭」能搜到铁锭、生铁锭、锻铁锭……
  英文查询照旧直接走数据集索引。

当前覆盖率（`scratch/coverage.mjs` 实测）：要素 100%、流体 98%、物品 79.8%，整体 80.2%。
扣掉 8,095 条 `Ore Dictionary:` 合成占位和 358 条选项占位，真实资源的覆盖率是 **91.6%**。

## 去掉了什么

| 去掉的东西 | 处理 |
|---|---|
| 社区（浏览/发布/评论/投票） | 删了 `/community` 页面与 `/api/community/*`，Library 左栏的 Community、Welcome 的社区推荐一并去掉 |
| 账户 | 删了 `/api/accounts/*`、`/api/library/*`、顶栏的登录键（`AccountKey`） |
| 蓝图 | 删了 `/api/blueprints/*` |
| 反馈 | 删了 `/api/feedback/*` 与顶栏反馈键 |
| 云同步 / 共享方案 | 「共享给我」书架与邀请入口不再渲染（live 服务本来就要 Supabase 配置才启用） |
| 统计 | 去掉了 umami 的 `Analytics` 组件 |

本地功能都还在：方案保存在浏览器里（IndexedDB）、导入导出 JSON、画板、求解器、调配表、任务板。

## 已知还差的部分

1. **物品图标**：已补齐 `public/datasets/gtnh/<版本>/textures/rendered/` 下 5.75 万个图标文件
   （`scratch/fetch-icons.mjs`，断点续传、并发 32）。数据集当前引用的图标全部到位，共约 210 MB。
2. **少量文案**：模板字符串拼出来的句子（如 `12 machines`）、物品 tooltip 的说明段落仍是英文；
   异域合金（`Tantalum Hafnium Carbide Arrow Head` 这类材料不在材料表里）仍显示英文。
3. **配方类型名**：185 个已全部有译名（`src/lib/i18n/recipe-maps.zh.json`），
   控件里通过 `tRecipeMap()` 显示，标识符本身保持英文以免影响筛选。
4. **要素**：69 个神秘时代要素全部有译名（`src/lib/i18n/aspects.ts`）。

## 目录

```
gtnhplanner-zh/
├─ scripts/serve.mjs          本地启动（不开子进程的 Next 服务器）
├─ public/datasets/gtnh/      本地数据集（不入版本库）
├─ src/lib/i18n/              中文化：ui.zh.json、names.zh.json、t()、服务端换名
├─ src/app/api/dataset/       静态数据集接口（原来的 [versionId] 动态路由改成固定路径）
├─ scripts/fetch-dataset.mjs  拉数据集（manifest、索引、配方整包）
├─ scripts/fetch-shards.mjs   拉 1112 个配方分片
├─ scripts/fetch-icons.mjs    拉 5.7 万张物品图标（断点续传）
└─ scratch/                   本次改造用的临时脚本与产物（不入库）
```

## 许可

整仓库以 **GPL-3.0** 发布：汉化词库派生自 GPL-3.0 的
[GTNH-Translations](https://github.com/GTNewHorizons/GTNH-Translations)，不能只挂 MIT。
上游代码原为 MIT（Samiracle64、jackwrichards），原始声明保留在 [NOTICE.md](NOTICE.md)。

GTNH、Minecraft、各 mod 的素材与配方数据不属于本项目，**不随仓库分发**：clone 下来后
用 `scripts/fetch-dataset.mjs` / `fetch-shards.mjs` / `fetch-icons.mjs` 自己拉，且只供个人使用。

发布步骤见 [PUBLISH.md](PUBLISH.md)。
