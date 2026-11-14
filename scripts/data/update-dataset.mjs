// 数据集自动更新：对比 gtnhplanner.com 的 manifest，有新版本才下载。
//
//   node scripts/data/update-dataset.mjs .           检查并下载
//   node scripts/data/update-dataset.mjs . --check   只检查，不下载（适合定时任务里先探一下）
//
// 下载顺序：manifest → 版本索引文件 → 配方分片 → 物品图标。
// 每一步都有进度条，已存在的文件跳过，支持断点续传。
import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import zlib from "node:zlib";
import { createProgress, formatBytes } from "./progress.mjs";

const ROOT = process.argv[2] ?? ".";
const CHECK_ONLY = process.argv.includes("--check");
const OUT = path.join(ROOT, "public", "datasets", "gtnh");
const BASE = "https://gtnhplanner.com";
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "*/*",
  "Accept-Encoding": "identity",
};

function fetchJson(url, tries = 5) {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      const req = https.get(url, { headers: HEADERS, timeout: 30000 }, (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch (error) {
            reject(error);
          }
        });
      });
      req.on("timeout", () => req.destroy(new Error("timeout")));
      req.on("error", (error) => {
        if (n >= tries) reject(error);
        else setTimeout(() => attempt(n + 1), 1500 * n);
      });
    };
    attempt(1);
  });
}

/** 下载一个文件，支持续传和进度条。 */
function download(urlPath, dest, label) {
  return new Promise((resolve, reject) => {
    const part = dest + ".part";
    const have = fs.existsSync(part) ? fs.statSync(part).size : 0;
    const headers = { ...HEADERS };
    if (have > 0) headers.Range = `bytes=${have}-`;
    const req = https.get(BASE + urlPath, { headers, timeout: 120000 }, (res) => {
      if (res.statusCode === 416) {
        res.resume();
        resolve("complete");
        return;
      }
      if (res.statusCode !== 200 && res.statusCode !== 206) {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      const total = Number(res.headers["content-length"] ?? 0) + (res.statusCode === 206 ? have : 0);
      const file = fs.createWriteStream(part, { flags: res.statusCode === 206 ? "a" : "w" });
      let got = have;
      const progress = createProgress({ label: label.slice(0, 24).padEnd(24), total: total || 0, unit: "B" });
      res.on("data", (chunk) => {
        got += chunk.length;
        progress.update(got);
      });
      res.on("error", reject);
      file.on("error", reject);
      file.on("finish", () =>
        file.close(() => {
          progress.finish(total || got);
          fs.renameSync(part, dest);
          resolve(got);
        }),
      );
      res.pipe(file);
    });
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
  });
}

function gunzipJson(file) {
  return JSON.parse(zlib.gunzipSync(fs.readFileSync(file)).toString("utf8"));
}

async function main() {
  console.log(`数据目录：${OUT}\n`);
  const remote = await fetchJson(`${BASE}/datasets/gtnh/datasets.manifest.json?t=${Date.now()}`);
  const targetId = remote.latestStableVersion ?? remote.versions[0]?.id;
  const target = remote.versions.find((version) => version.id === targetId);
  if (!target) throw new Error("线上 manifest 里没有可用的版本");

  const localManifestPath = path.join(OUT, "datasets.manifest.json");
  const local = fs.existsSync(localManifestPath) ? JSON.parse(fs.readFileSync(localManifestPath, "utf8")) : undefined;
  const localTarget = local?.versions?.find((version) => version.id === target.id);

  console.log(`线上最新：${target.id}（${target.gtnhVersion}，${target.channel}）`);
  console.log(`本地已有：${localTarget ? `${localTarget.id}（${localTarget.publishedAt}）` : "无"}`);

  const sameVersion = localTarget && localTarget.checksumSha256 === target.checksumSha256;
  if (sameVersion) console.log("版本号与校验和一致。");
  else if (localTarget) console.log("同版本号但数据变了（上游重新发布），需要更新。");
  else console.log("本地没有这个版本，需要下载。");

  if (CHECK_ONLY) {
    console.log(sameVersion ? "\n[检查模式] 已是最新，无需下载。" : "\n[检查模式] 有新数据，可运行 update.cmd 更新。");
    return;
  }

  if (!sameVersion) {
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(localManifestPath, JSON.stringify(remote, null, 2) + "\n", "utf8");
    console.log("已更新 datasets.manifest.json");
  }

  // 1. 版本索引与配方整包
  const files = [
    ["resourceIndexPath", "resource-index.json.gz"],
    ["recipeIndexPath", "recipe-index.json.gz"],
    ["recipeLookupIndexPath", "recipe-lookup-index.json.gz"],
    ["recipeDatasetPath", "recipes.json.gz"],
  ];
  for (const [key, label] of files) {
    const urlPath = target[key];
    if (!urlPath) continue;
    const dest = path.join(OUT, urlPath.replace(/^\/datasets\/gtnh\//, ""));
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1024) {
      console.log(`跳过 ${label}（已存在，${formatBytes(fs.statSync(dest).size)}）`);
      continue;
    }
    console.log(`\n下载 ${label}`);
    try {
      await download(urlPath, dest, label);
    } catch (error) {
      console.error(`  ✗ ${label} 下载失败：${error.message}`);
      process.exitCode = 1;
      return;
    }
  }

  const resourceIndex = path.join(OUT, target.id, "resource-index.json.gz");
  if (!fs.existsSync(resourceIndex)) {
    console.error("resource-index.json.gz 缺失，无法继续拉分片与图标。");
    process.exitCode = 1;
    return;
  }
  const catalog = gunzipJson(resourceIndex);

  // 2. 配方分片
  const shardDir = path.join(OUT, target.id, "recipes-shards");
  fs.mkdirSync(shardDir, { recursive: true });
  const missingShards = (catalog.shards ?? []).filter(
    (shard) => !fs.existsSync(path.join(shardDir, path.basename(shard.path))),
  );
  if (missingShards.length === 0) {
    console.log(`\n配方分片：${(catalog.shards ?? []).length} 个，已齐全`);
  } else {
    console.log(`\n配方分片：缺 ${missingShards.length} 个`);
    const progress = createProgress({ label: "配方分片", total: missingShards.length, unit: "个" });
    let done = 0;
    const queue = [...missingShards];
    await Promise.all(
      Array.from({ length: 8 }, async () => {
        for (;;) {
          const shard = queue.shift();
          if (!shard) return;
          const dest = path.join(shardDir, path.basename(shard.path));
          try {
            await download(shard.path, dest, path.basename(shard.path));
          } catch {
            /* 记在进度里，下次重跑会补 */
          }
          done++;
          progress.update(done, path.basename(shard.path));
        }
      }),
    );
    progress.finish(missingShards.length, "分片完成");
  }

  // 3. 图标
  const iconPaths = [...new Set((catalog.resources ?? []).map((resource) => resource.iconPath).filter((p) => p?.startsWith("/datasets/")))];
  const root = ROOT;
  const missingIcons = iconPaths.filter((iconPath) => !fs.existsSync(path.join(root, "public", iconPath.slice(1))));
  if (missingIcons.length === 0) {
    console.log(`\n物品图标：${iconPaths.length} 张，已齐全`);
  } else {
    console.log(`\n物品图标：共 ${iconPaths.length} 张，缺 ${missingIcons.length} 张`);
    const progress = createProgress({ label: "物品图标", total: missingIcons.length, unit: "张" });
    let done = 0;
    const queue = [...missingIcons];
    const agent = new https.Agent({ keepAlive: true, maxSockets: 24, maxFreeSockets: 8 });
    await Promise.all(
      Array.from({ length: 24 }, async () => {
        for (;;) {
          const iconPath = queue.shift();
          if (!iconPath) return;
          const dest = path.join(root, "public", iconPath.slice(1));
          try {
            await new Promise((resolve, reject) => {
              const req = https.get(BASE + iconPath, { agent, headers: HEADERS, timeout: 30000 }, (res) => {
                if (res.statusCode !== 200) {
                  res.resume();
                  reject(new Error(`HTTP ${res.statusCode}`));
                  return;
                }
                fs.mkdirSync(path.dirname(dest), { recursive: true });
                const file = fs.createWriteStream(dest + ".part");
                res.pipe(file);
                file.on("finish", () => file.close(() => {
                  fs.renameSync(dest + ".part", dest);
                  resolve();
                }));
                file.on("error", reject);
              });
              req.on("timeout", () => req.destroy(new Error("timeout")));
              req.on("error", reject);
            });
          } catch {
            /* 下次重跑补 */
          }
          done++;
          progress.update(done, path.basename(iconPath).slice(0, 40));
        }
      }),
    );
    agent.destroy();
    progress.finish(missingIcons.length, "图标完成");
  }

  console.log("\n数据更新完成。重启 start.cmd 后生效（服务端有内存缓存）。");
}

main().catch((error) => {
  console.error("更新失败：", error.message);
  process.exitCode = 1;
});
