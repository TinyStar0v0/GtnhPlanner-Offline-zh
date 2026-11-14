/**
 * 单数据集的自用站点：所有数据集接口共用一个版本号。
 *
 * 版本从查询参数 `version` 取（客户端仍然带着它当缓存键），没带就读 manifest
 * 里的默认版本，这样 `/api/dataset/catalog` 直接打开也能用。
 */
import fs from "node:fs";
import path from "node:path";

const DATASET_ROOT = path.join(process.cwd(), "public", "datasets", "gtnh");

let cachedDefault: string | undefined;

export function resolveDatasetVersionId(request: Request): string {
  const fromQuery = new URL(request.url).searchParams.get("version");
  if (fromQuery) {
    return fromQuery;
  }
  return defaultDatasetVersionId();
}

export function defaultDatasetVersionId(): string {
  if (cachedDefault) {
    return cachedDefault;
  }
  try {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(DATASET_ROOT, "datasets.manifest.json"), "utf8"),
    ) as { versions?: Array<{ id: string }>; latestStableVersion?: string };
    cachedDefault =
      manifest.latestStableVersion ?? manifest.versions?.[manifest.versions.length - 1]?.id;
  } catch {
    cachedDefault = undefined;
  }
  if (!cachedDefault) {
    throw new Error("No dataset version found in public/datasets/gtnh/datasets.manifest.json.");
  }
  return cachedDefault;
}
