# 与游戏内同名模组联动（Open in the mod）

网页版和游戏内的 **GTNH Planner 模组**可以用一个本地端口直接对接：网页上点一下，方案就出现在游戏里的规划器里，不用手抄方案码。

## 它怎么工作

模组在游戏进程里监听 `127.0.0.1` 的 **25640–25649** 这十个端口（第一个能用的就占住）。网页端做两件事：

| 请求 | 用途 | 期望响应 |
|---|---|---|
| `GET /ping` | 找游戏在哪个端口 | `{"app":"gtnhplanner","version":"0.2.0"}` |
| `POST /open` | 把方案交给游戏 | `202` 才算被接住 |

`POST /open` 的请求体是 `{"code": "<方案码>", "name": "<方案名>"}`，方案码就是网页「分享 → 复制方案码」得到的那串。

实现见 [`src/lib/mod-link/mod-link.ts`](../src/lib/mod-link/mod-link.ts)，单元测试是同目录的 `mod-link.test.ts`（覆盖端口、ping 识别、202 判定、拒绝的情况）。

## 怎么用

1. 游戏里装 **GTNH Planner** 模组（`GTNewHorizons/PlanNH`），版本 0.2.0 以上
2. 进入游戏世界，模组的本地监听默认开着
3. 网页上打开一个方案 → 右上角 **Share**（分享）→ 菜单里出现 **Open in the mod**
4. 点它，方案就进游戏了

菜单里这一行只在**检测到游戏在跑**时才出现：网页每次打开分享菜单都会 ping 一遍那十个端口，没有回应就不显示。

## 需要注意

- **必须是同一台机器**：走的是 `127.0.0.1`，网页在别的电脑上连不到你游戏里的监听。
- **浏览器可能拦本地网络请求**：Chrome/Edge 对「网页访问 localhost」有额外限制（Private Network Access）。
  如果点了没反应，在地址栏左侧的站点设置里允许本地网络访问，或换 Firefox 试。
- **防火墙**：Windows 防火墙拦 Java 的出站/入站时，模组监听可能起不来，给 `javaw.exe` 放行。
- **端口被占**：25640–25649 被别的程序占满时模组会监听失败，关掉占用者再进游戏。
- **反向不成立**：模组不能主动推方案给网页；要从游戏导出请用模组自己的「导出方案码」，再在网页里「导入方案」。

## 相关代码

| 位置 | 作用 |
|---|---|
| `src/lib/mod-link/mod-link.ts` | 端口探测、ping、发送方案码 |
| `src/components/chrome/share-actions.ts`（`openInModRow`、`useModReach`） | Share 菜单里的那一行与可达性探测 |
| `src/components/chrome/ModBar.tsx` | 组装 Share 菜单 |
