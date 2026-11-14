// 终端进度条：百分比 + 已完成/总数 + 速率 + 预计剩余时间。
// 输出到 TTY 时用 \r 原地刷新；被重定向（日志/管道）时退化成每 5 秒一行，避免刷屏。

const BAR_WIDTH = 24;

function bar(percent) {
  const filled = Math.max(0, Math.min(BAR_WIDTH, Math.round((percent / 100) * BAR_WIDTH)));
  return "[" + "#".repeat(filled) + "-".repeat(BAR_WIDTH - filled) + "]";
}

export function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "--";
  if (seconds < 60) return `${Math.ceil(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m${String(Math.round(seconds % 60)).padStart(2, "0")}s`;
  return `${Math.floor(seconds / 3600)}h${String(Math.round((seconds % 3600) / 60)).padStart(2, "0")}m`;
}

export function formatBytes(bytes) {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)} GB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

/**
 * @param {{label: string, total: number, unit?: string, intervalMs?: number}} options
 */
export function createProgress({ label, total, unit = "项", intervalMs = 1500 }) {
  const started = Date.now();
  let lastPrint = 0;
  let lastPercent = -1;

  function line(done, extra) {
    const seconds = (Date.now() - started) / 1000;
    const rate = done / Math.max(seconds, 0.001);
    const percent = total > 0 ? Math.min(100, (done / total) * 100) : 0;
    const eta = rate > 0 ? (total - done) / rate : 0;
    const speed = unit === "B" ? `${formatBytes(rate)}/s` : `${rate.toFixed(1)} ${unit}/s`;
    const extraText = extra ? `  ${extra}` : "";
    return `${label} ${bar(percent)} ${percent.toFixed(1).padStart(5)}%  ${done}/${total}  ${speed}  剩余 ${formatDuration(eta)}${extraText}`;
  }

  function render(done, extra, force = false) {
    const now = Date.now();
    const finished = total > 0 && done >= total;
    if (process.stdout.isTTY) {
      if (!force && now - lastPrint < 200 && !finished) return;
      lastPrint = now;
      const text = line(done, extra);
      process.stdout.write(`\r${text}\x1b[K`);
      if (finished) process.stdout.write("\n");
      return;
    }
    // 非 TTY：按百分比台阶输出，避免几百行
    const percent = total > 0 ? Math.floor((done / total) * 100) : 0;
    if (!force && !finished && (now - lastPrint < 5000 || percent === lastPercent)) return;
    if (percent === lastPercent && !finished) return;
    lastPrint = now;
    lastPercent = percent;
    console.log(line(done, extra));
  }

  return {
    update: (done, extra) => render(done, extra),
    finish: (done = total, extra) => render(done, extra, true),
    /** 单独一行说明，不覆盖进度条 */
    note: (text) => {
      if (process.stdout.isTTY) process.stdout.write("\n");
      console.log(text);
    },
  };
}
