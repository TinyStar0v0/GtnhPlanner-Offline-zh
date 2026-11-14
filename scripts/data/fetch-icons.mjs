// 下载物品/流体图标：resource-index 里每条资源的 iconPath 都指向一张 PNG。
// 支持断点续传（已存在的文件跳过）、并发连接、失败重试。
import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import zlib from "node:zlib";

const root = process.argv[2];
const VERSION = "local-2.9.0-rc-2";
const BASE = "https://gtnhplanner.com";
const LOG = path.join(root, "scratch", "icons-progress.log");

process.on("uncaughtException", (error) => {
  fs.appendFileSync(LOG, `uncaught: ${error?.stack ?? error}\n`);
});
process.on("unhandledRejection", (reason) => {
  fs.appendFileSync(LOG, `unhandled: ${reason?.stack ?? reason}\n`);
});

const catalog = JSON.parse(
  zlib
    .gunzipSync(fs.readFileSync(path.join(root, "public", "datasets", "gtnh", VERSION, "resource-index.json.gz")))
    .toString("utf8"),
);

const seen = new Set();
const targets = [];
for (const resource of catalog.resources) {
  const iconPath = resource.iconPath;
  if (!iconPath || !iconPath.startsWith("/datasets/") || seen.has(iconPath)) continue;
  seen.add(iconPath);
  targets.push({ remote: iconPath, local: path.join(root, "public", iconPath.slice(1)) });
}

const missing = targets.filter((item) => !fs.existsSync(item.local));
fs.appendFileSync(LOG, `--- start: ${targets.length} icons, ${missing.length} missing\n`);
console.log(`icons: ${targets.length}, already: ${targets.length - missing.length}, to fetch: ${missing.length}`);

const agent = new https.Agent({ keepAlive: true, maxSockets: 32, maxFreeSockets: 8 });
let done = 0;
let failed = 0;
const failures = [];

function fetchOne(url, dest, depth = 0) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        agent,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Accept: "image/avif,image/webp,image/png,image/*,*/*;q=0.8",
          Referer: "https://gtnhplanner.com/",
          "Accept-Encoding": "identity",
        },
        timeout: 30000,
      },
      (res) => {
        if (depth < 5 && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          resolve(fetchOne(new URL(res.headers.location, BASE).href, dest, depth + 1));
          return;
        }
        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        try {
          fs.mkdirSync(path.dirname(dest), { recursive: true });
        } catch (error) {
          reject(error);
          return;
        }
        const tmp = `${dest}.${process.pid}.part`;
        const file = fs.createWriteStream(tmp);
        res.pipe(file);
        file.on("finish", () => {
          file.close(() => {
            try {
              fs.renameSync(tmp, dest);
              resolve();
            } catch (error) {
              reject(error);
            }
          });
        });
        file.on("error", (error) => {
          try {
            fs.rmSync(tmp, { force: true });
          } catch {
            /* 清理失败不影响重试 */
          }
          reject(error);
        });
        res.on("error", reject);
      },
    );
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
  });
}

const started = Date.now();

async function worker(queue) {
  for (;;) {
    const item = queue.shift();
    if (!item) return;
    let ok = false;
    for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
      try {
        await fetchOne(BASE + item.remote, item.local);
        ok = true;
      } catch (error) {
        if (attempt === 3) {
          failed++;
          failures.push({ remote: item.remote, error: String(error?.message ?? error) });
        } else {
          await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
        }
      }
    }
    if (ok) done++;
    const total = done + failed;
    if (total % 1000 === 0) {
      const rate = total / ((Date.now() - started) / 1000);
      const left = Math.round((queue.length + total) / Math.max(rate, 0.1));
      const line = `progress ${total}/${missing.length} | ${rate.toFixed(1)}/s | eta ${Math.round(left / 60)} min`;
      console.log(line);
      fs.appendFileSync(LOG, `${line}\n`);
    }
  }
}

await Promise.all(Array.from({ length: 32 }, () => worker(missing)));
agent.destroy();
console.log(`DONE fetched=${done} failed=${failed}`);
fs.appendFileSync(LOG, `--- done: fetched=${done} failed=${failed}\n`);
if (failures.length) {
  fs.writeFileSync(path.join(root, "scratch", "icon-failures.json"), JSON.stringify(failures, null, 1));
  console.log("failures written to scratch/icon-failures.json");
}
