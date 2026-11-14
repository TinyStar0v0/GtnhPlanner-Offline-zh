# 第三方声明与许可

本仓库是 [gtnhplanner.com](https://gtnhplanner.com) 的中文自用改版，代码基于
[jackwrichards/gtnh-factory-flow](https://github.com/jackwrichards/gtnh-factory-flow)。

## 许可证

本仓库整体以 **GNU General Public License v3.0** 发布，全文见 [`LICENSE`](LICENSE)。

原因是：仓库里的汉化词库（`src/lib/i18n/*.json`、`aspects.ts`、`tooltips.ts` 的部分条目）
派生自 [GTNewHorizons/GTNH-Translations](https://github.com/GTNewHorizons/GTNH-Translations)
的 `zh_CN` 语言文件，该仓库以 **GPL-3.0** 授权。把派生数据放进 MIT 项目再分发不合规，
因此整体转为 GPL-3.0。原 MIT 版权声明保留在下面。

## 原始版权（MIT）

```
MIT License

Copyright (c) 2026 Samiracle64
Copyright (c) 2026 jackwrichards

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 汉化数据

- [`GTNewHorizons/GTNH-Translations`](https://github.com/GTNewHorizons/GTNH-Translations)：
  `zh_CN` 语言文件（GPL-3.0）。`names.zh.json` 里约 2.9 万条英中对照来自它。
- [`NanShang126/gtnh-planner-zh`](https://github.com/NanShang126/gtnh-planner-zh)：
  油猴脚本里的名词表（MIT），3.2 万条词典的底子来自这里。
- 配方类型名、要素名、界面文案的手工翻译由本仓库维护者完成。

## 数据集（不随仓库分发）

`public/datasets/` 是从 gtnhplanner.com 公开地址下载的 GTNH 2.9.0-RC-2 配方数据与渲染图标，
**不在本仓库里**，也不在本许可证覆盖范围内：GTNH、Minecraft、各 mod 的素材与数据版权归各自作者。
需要数据请自己运行 `scratch/fetch-dataset.mjs` 与 `scratch/fetch-icons.mjs`，并遵守
gtnhplanner.com 与 GTNH 的使用条款。仅限个人使用，不要再分发。
