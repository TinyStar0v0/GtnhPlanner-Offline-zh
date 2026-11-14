# 发布到 GitHub

> **当前状态**：本地仓库已经初始化并提交好了（`398db71`，1,743 个文件），
> 远程已指向 <https://github.com/TinyStar0v0/GtnhplannerWeb-Offline-zh.git>。
> 只剩下 `git push` 这一步——它需要登录凭据，在这台机器的沙箱里做不了
> （schannel 拿不到凭据、GCM 需要命名管道）。
>
> 两条路：
> - 装了 Git for Windows 后，双击 **`scripts\release\push.cmd`**，浏览器弹窗登录即可；
> - 或者 `scripts\release\push.cmd <你的 token>`（fine-grained，只给这个仓库 Contents 写权限），
>   推完脚本会把带 token 的地址换回干净地址，之后去 GitHub 撤销 token。
>
> 下面是从零开始发布时的完整说明，留作参考。

仓库已经整理好：数据集、图标、`node_modules`、`scratch` 都被 `.gitignore` 排除，
要提交的只有代码 + 汉化词库（约 1,600 个文件 / 59 MB，其中 28 MB 是上游的宣传视频）。

## 0. 先装 Git

这台机器上没有 git。装 [Git for Windows](https://git-scm.com/download/win)
（一路下一步即可，自带 Git Credential Manager，推送时会弹浏览器登录）。

装完新开一个 PowerShell 窗口，确认：

```powershell
git --version
```

## 1. 在 GitHub 上建空仓库

打开 <https://github.com/new>：

- Repository name：`gtnhplanner-zh`
- 选 **Public**
- **不要**勾 "Add a README file"、"Add .gitignore"、"Choose a license"（本地已经有）

建好后拿到地址，形如 `https://github.com/<你的用户名>/gtnhplanner-zh.git`。

## 2. 提交并在本地准备好

在 `gtnhplanner-zh` 目录里：

```powershell
git init -b main
git add -A
git status                 # 确认没有 public/datasets、node_modules、scratch
git commit -m "GTNH Planner 中文自用版：本地数据集、全量汉化、去掉社区与账户"
git remote add origin https://github.com/<你的用户名>/gtnhplanner-zh.git
```

第一次提交前如果没配过身份，先跑一次：

```powershell
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"
```

## 3. 推送

```powershell
git push -u origin main
```

会弹出 GitHub 登录窗口（浏览器），登录授权后自动完成。之后改代码只要：

```powershell
git add -A
git commit -m "说明改了什么"
git push
```

## 如果没装 Git for Windows，只有便携版 git

便携版没有 Credential Manager，需要 Personal Access Token：

1. GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens**
2. 生成一个，Repository access 选这个仓库，权限给 **Contents: Read and write**
3. 推送时用：

```powershell
git remote set-url origin https://<用户名>:<TOKEN>@github.com/<用户名>/gtnhplanner-zh.git
git push -u origin main
```

推完可以把 URL 里的 token 去掉（`git remote set-url origin https://github.com/...`），
别把带 token 的地址提交到任何地方。

## 别人 clone 下来怎么跑

仓库里没有配方数据和图标（版权归 GTNH，且 342 MB）。`README.zh.md` 的「数据从哪来」一节写了：

```powershell
node scripts/data/fetch-dataset.mjs .
node scripts/data/fetch-shards.mjs .
node scripts/data/fetch-icons.mjs .
```

两个脚本都支持断点续传，从 gtnhplanner.com 的公开地址拉取。拉完 `start.cmd` 就能跑。

## 常见问题

- **`git add` 很慢**：正常，1,600 个文件里有些 5 MB 的测试基准数据。
- **提示文件超过 100 MB**：不会，最大的是 28 MB 的宣传视频。
- **`public/datasets` 被提交了**：检查 `.gitignore` 里是否还有 `/public/datasets/gtnh/`。
- **想换许可证**：见 `NOTICE.md`，整仓库是 GPL-3.0（因为汉化词库派生自 GPL-3.0 数据）。
