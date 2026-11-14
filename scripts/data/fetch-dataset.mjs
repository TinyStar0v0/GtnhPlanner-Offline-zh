// Downloads the GTNH recipe dataset published by gtnhplanner.com into
// public/datasets/gtnh so this personal copy runs fully offline.
// Resumable: partial files are kept as .part and continued with a Range header.
import { createWriteStream, mkdirSync, statSync, existsSync, renameSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import https from "node:https";
import { createProgress } from "./progress.mjs";

const BASE = "https://gtnhplanner.com";
const OUT = process.argv[2];
const VERSION = "local-2.9.0-rc-2";
const FILES = [
  "/datasets/gtnh/datasets.manifest.json",
  `/datasets/gtnh/${VERSION}/resource-index.json.gz`,
  `/datasets/gtnh/${VERSION}/recipe-index.json.gz`,
  `/datasets/gtnh/${VERSION}/recipe-lookup-index.json.gz`,
  `/datasets/gtnh/${VERSION}/recipes.json.gz`,
];

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "*/*",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://gtnhplanner.com/",
  "Accept-Encoding": "identity",
};

function once(url, dest, depth = 0) {
  return new Promise((resolve, reject) => {
    const part = dest + ".part";
    const have = existsSync(part) ? statSync(part).size : 0;
    const headers = { ...HEADERS };
    if (have > 0) headers.Range = `bytes=${have}-`;
    const req = https.get(url, { headers, timeout: 120000 }, (res) => {
      if (depth < 6 && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        resolve(once(new URL(res.headers.location, url).href, dest, depth + 1));
        return;
      }
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
      const total = Number(res.headers["content-length"] ?? 0) + (res.statusCode === 206 ? have : 0);
      const file = createWriteStream(part, { flags: have > 0 && res.statusCode === 206 ? "a" : "w" });
      let got = have;
      const name = dest.split(/[\\/]/).pop();
      const progress = createProgress({ label: name.slice(0, 26).padEnd(26), total: total || 0, unit: "B" });
      if (have > 0) progress.note(`  ${name} 从 ${(have / 1048576).toFixed(1)} MB 处续传`);
      res.on("data", (chunk) => {
        got += chunk.length;
        progress.update(got);
      });
      res.on("error", reject);
      file.on("error", reject);
      file.on("finish", () => file.close(() => {
        progress.finish(total || got);
        resolve({ got, total });
      }));
      res.pipe(file);
    });
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
  });
}

async function fetchFile(path) {
  const dest = join(OUT, path.replace(/^\/datasets\/gtnh\//, ""));
  mkdirSync(dirname(dest), { recursive: true });
  if (existsSync(dest) && statSync(dest).size > 1024) return "exists";
  for (let attempt = 1; attempt <= 8; attempt++) {
    try {
      const r = await once(BASE + path, dest);
      if (r === "complete" || (r.total && r.got >= r.total) || (!r.total && r.got > 0)) {
        renameSync(dest + ".part", dest);
        console.log(`  ✓ ${path}  ${(statSync(dest).size / 1048576).toFixed(2)} MB`);
        return "ok";
      }
      console.log(`  partial ${r.got}/${r.total}, retrying`);
    } catch (err) {
      console.log(`  attempt ${attempt} failed: ${err.message}`);
      await new Promise((res) => setTimeout(res, 3000));
    }
  }
  throw new Error(`gave up on ${path}`);
}

for (const path of FILES) {
  console.log(`fetch ${path}`);
  await fetchFile(path);
}
console.log("ALL FILES DONE");
