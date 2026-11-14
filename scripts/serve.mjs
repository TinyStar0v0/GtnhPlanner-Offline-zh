// 本地启动脚本：直接在当前进程里跑 Next（不用 CLI 的 fork，沙箱里也能起）。
//
// 用法：node scripts/serve.mjs [dev|start] [端口] [--no-open]
//   - 端口上已经有本站时，不报错，直接把浏览器叫起来。
//   - 起好之后自动打开浏览器（--no-open 可关）。
import http from "node:http";
import { spawn } from "node:child_process";
import next from "next";

const mode = process.argv[2] === "start" ? "start" : "dev";
const portArg = process.argv.find((arg) => /^\d+$/.test(arg));
const port = Number(portArg ?? 3000);
const hostname = "127.0.0.1";
const url = `http://${hostname}:${port}`;
const shouldOpen = !process.argv.includes("--no-open");

/** 端口上是不是已经有本站（而不是别的程序）。 */
function probe(timeoutMs = 1500) {
  return new Promise((resolve) => {
    const request = http.get(`${url}/api/version`, { timeout: timeoutMs }, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => (body += chunk));
      response.on("end", () => resolve(response.statusCode === 200 && body.includes("version")));
    });
    request.on("timeout", () => {
      request.destroy();
      resolve(false);
    });
    request.on("error", () => resolve(false));
  });
}

function openBrowser() {
  if (!shouldOpen) return;
  try {
    // stdio 用 ignore：受限环境里带管道的子进程会被拒。
    spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" }).unref();
  } catch {
    console.log(`浏览器没自动打开，请手动访问 ${url}`);
  }
}

if (await probe()) {
  console.log(`本站已经在 ${url} 跑着了，直接打开。`);
  openBrowser();
  process.exit(0);
}

const app = next({ dev: mode === "dev", dir: process.cwd(), hostname, port });
await app.prepare();
const handle = app.getRequestHandler();

const server = http.createServer((req, res) => handle(req, res));

server.on("error", async (error) => {
  if (error.code === "EADDRINUSE") {
    // 有人先抢了端口：如果抢的是本站，就当成已启动。
    if (await probe()) {
      console.log(`本站已经在 ${url} 跑着了，直接打开。`);
      openBrowser();
      process.exit(0);
    }
    console.error(`端口 ${port} 被别的程序占用了，换一个：start.cmd 里把 3100 改成别的。`);
    process.exit(1);
  }
  console.error(error);
  process.exit(1);
});

server.listen(port, hostname, () => {
  console.log("");
  console.log(`  GTNH Planner 中文自用版已启动：${url}`);
  console.log("  这个窗口别关，关掉网站就停了。要停就按 Ctrl+C。");
  console.log("");
  openBrowser();
});
