// 下载配方分片：数据集把 27.8 万条配方切成 1112 个 shard，服务端按 shard 读盘。
// 缺了它们，配方查询和作物查询都会 ENOENT。
import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import { createProgress } from "./progress.mjs";
import zlib from "node:zlib";

const root = process.argv[2];
const manifestPath = path.join(root, "public", "datasets", "gtnh", "local-2.9.0-rc-2", "resource-index.json.gz");
const base = "https://gtnhplanner.com";
const outDir = path.join(root, "public", "datasets", "gtnh", "local-2.9.0-rc-2", "recipes-shards");

const catalog = JSON.parse(zlib.gunzipSync(fs.readFileSync(manifestPath)).toString("utf8"));
const shards = catalog.shards;
fs.mkdirSync(outDir, { recursive: true });

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "*/*",
  Referer: "https://gtnhplanner.com/",
  "Accept-Encoding": "identity",
};

function fetchOne(pathname, dest, depth = 0) {
  return new Promise((resolve, reject) => {
    const req = https.get(base + pathname, { headers: HEADERS, timeout: 60000 }, (res) => {
      if (depth < 5 && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        resolve(fetchOne(new URL(res.headers.location, base).pathname, dest, depth + 1));
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const tmp = dest + ".part";
      const file = fs.createWriteStream(tmp);
      res.pipe(file);
      file.on("finish", () => {
        file.close(() => {
          fs.renameSync(tmp, dest);
          resolve(fs.statSync(dest).size);
        });
      });
      file.on("error", reject);
      res.on("error", reject);
    });
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
  });
}

const pending = shards
  .map((shard) => ({
    remote: shard.path,
    local: path.join(outDir, path.basename(shard.path)),
  }))
  .filter(({ local }) => !fs.existsSync(local));

console.log(`配方分片：共 ${shards.length} 个，缺 ${pending.length} 个`);
const progress = createProgress({ label: "配方分片", total: Math.max(pending.length, 1), unit: "个" });
if (pending.length === 0) progress.finish(1, "已全部下载，无需重下");

const CONCURRENCY = 10;
let done = 0;
let failed = 0;

async function worker(queue) {
  for (;;) {
    const item = queue.shift();
    if (!item) return;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await fetchOne(item.remote, item.local);
        done++;
        break;
      } catch (error) {
        if (attempt === 3) {
          failed++;
          console.log(`failed ${item.remote}: ${error.message}`);
        } else {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    progress.update(done + failed, `${item.remote.split("/").pop()}${failed ? `（失败 ${failed}）` : ""}`);
  }
}

const queue = [...pending];
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)));
progress.finish(done + failed, `完成 ${done} 个${failed ? `，失败 ${failed} 个` : ""}`);
