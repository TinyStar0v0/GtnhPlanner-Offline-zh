import { NextResponse } from "next/server";
import { resolveDatasetVersionId } from "@/lib/server/dataset-version";
import { localizeDatasetNames } from "@/lib/i18n/localize";
import { englishNamesFor } from "@/lib/i18n/names";
import { datasetCacheHeaders } from "@/lib/server/dataset-cache-headers";
import { queryDatasetResources } from "@/lib/server/dataset-query";
import { getResourcePopularity } from "@/lib/server/resource-popularity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ResourceQuery = Parameters<typeof queryDatasetResources>[1];
type BaseQuery = Omit<ResourceQuery, "query">;

/** 中文查询要翻成英文再查：数据集里的检索索引只认英文名。 */
const CHINESE = /[\u4e00-\u9fff]/;

export async function GET(request: Request) {
  try {
    const versionId = resolveDatasetVersionId(request);
    const url = new URL(request.url);
    const kindParam = url.searchParams.get("kind");
    const sortParam = url.searchParams.get("sort");
    const sourceParam = url.searchParams.get("source");
    // Never awaits the database: the last good ranking, or none yet.
    const popularity = sortParam === "popular" ? getResourcePopularity() : undefined;
    const base: BaseQuery = {
      offset: parseOffset(url.searchParams.get("offset")),
      limit: parseLimit(url.searchParams.get("limit")),
      kind: kindParam === "item" || kindParam === "fluid" ? kindParam : undefined,
      mod: url.searchParams.get("mod") ?? undefined,
      sort:
        sortParam === "name" ||
        sortParam === "mod" ||
        sortParam === "recipes" ||
        sortParam === "made" ||
        sortParam === "uses" ||
        sortParam === "popular"
          ? sortParam
          : undefined,
      source: sourceParam === "plants" || sourceParam === "bees" ? sourceParam : undefined,
      popularity,
    };
    const query = url.searchParams.get("query") ?? "";

    const result = CHINESE.test(query)
      ? await searchChinese(versionId, query, base)
      : await queryDatasetResources(versionId, { ...base, query });

    return NextResponse.json(localizeDatasetNames(result), {
      // Popularity is community data, not dataset bytes: the datasetHash
      // fingerprint doesn't pin it, so it must not ride the immutable policy.
      headers:
        sortParam === "popular"
          ? { "Cache-Control": popularity?.size ? "public, max-age=1800" : "no-store" }
          : datasetCacheHeaders(request),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Resource query failed." },
      { status: 500 },
    );
  }
}

/**
 * 中文名的检索：先把中文反查成候选英文名，逐个查，再按 id 合并。
 * 候选按名字长度排（短的更接近通用名），最多查 8 个，够覆盖常见的「铁」「离心机」这类输入。
 */
async function searchChinese(
  versionId: string,
  query: string,
  base: BaseQuery,
) {
  const candidates = englishNamesFor(query)
    .sort((left, right) => left.length - right.length || left.localeCompare(right))
    .slice(0, 8);

  const merged = new Map<string, { resource: unknown; rank: number }>();
  let mods = new Map<string, number>();
  for (const candidate of candidates) {
    const page = await queryDatasetResources(versionId, { ...base, query: candidate, offset: 0, limit: 120 });
    page.resources.forEach((resource, index) => {
      const id = `${resource.kind}:${resource.id}`;
      if (!merged.has(id)) {
        merged.set(id, { resource, rank: index });
      }
    });
    for (const mod of page.mods ?? []) {
      mods.set(mod.id, (mods.get(mod.id) ?? 0) + mod.count);
    }
  }

  const all = [...merged.values()];
  const window = all.slice(base.offset, base.offset + base.limit).map((entry) => entry.resource);
  return {
    resources: window,
    total: all.length,
    offset: base.offset,
    limit: base.limit,
    hasMore: base.offset + base.limit < all.length,
    mods: [...mods.entries()]
      .map(([id, count]) => ({ id, count }))
      .sort((left, right) => right.count - left.count || left.id.localeCompare(right.id)),
  };
}

function parseOffset(value: string | null): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isInteger(parsed) ? Math.max(0, parsed) : 0;
}

function parseLimit(value: string | null): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isInteger(parsed) ? Math.max(1, Math.min(120, parsed)) : 24;
}
