// 启动前的自检：把失败原因用中文说清楚，并写进 scratch/logs/start.log。
// 这样即使 cmd 窗口一闪而过，也能查到底为什么起不来。
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const logDir = path.join(root, "scratch", "logs");
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, "start.log");

function log(line) {
  const stamp = new Date().toISOString();
  fs.appendFileSync(logFile, `[${stamp}] ${line}\n`, "utf8");
  console.log(line);
}

function fail(lines) {
  console.log("");
  for (const line of lines) console.log("  " + line);
  console.log("");
  log("启动失败：" + lines.join(" / "));
  console.log("  详细信息已写入 scratch\\logs\\start.log");
  console.log("");
  process.exitCode = 1;
  return false;
}

function check() {
  const major = Number(process.versions.node.split(".")[0]);
  log(`Node.js ${process.versions.node}，工作目录 ${root}`);
  if (major < 18) {
    return fail([
      `Node.js 版本太低（当前 ${process.versions.node}，需要 18 以上）。`,
      "去 https://nodejs.org/ 装新版，然后重新双击 start.cmd。",
    ]);
  }

  if (!fs.existsSync(path.join(root, "node_modules"))) {
    return fail([
      "依赖还没装（找不到 node_modules）。",
      "请先双击 setup.cmd，它会装依赖并下载配方数据。",
    ]);
  }

  if (!fs.existsSync(path.join(root, "public", "datasets", "gtnh", "datasets.manifest.json"))) {
    return fail([
      "配方数据还没下载（找不到 public\\datasets\\gtnh\\datasets.manifest.json）。",
      "请先双击 setup.cmd。它要下载约 400 MB，中途断了可以重跑。",
    ]);
  }

  return true;
}

const ok = check();
if (ok) {
  log("自检通过，启动服务器……");
  // 参数原样透传给 serve.mjs（它自己读 argv[2] / 端口 / --no-open）
  await import("./serve.mjs");
}
