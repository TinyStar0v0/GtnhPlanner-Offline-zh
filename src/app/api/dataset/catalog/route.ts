import { resolveDatasetVersionId } from "@/lib/server/dataset-version";
import { NextResponse } from "next/server";

import { localizeDatasetNames } from "@/lib/i18n/localize";
import { datasetCacheHeaders } from "@/lib/server/dataset-cache-headers";
import { getDatasetCatalog, prewarmDatasetVersion } from "@/lib/server/dataset-query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const versionId = resolveDatasetVersionId(request);
    void prewarmDatasetVersion(versionId).catch((error) => {
      console.error(`Dataset ${versionId} prewarm failed.`, error);
    });
    const catalog = await getDatasetCatalog(versionId);
    return NextResponse.json(localizeDatasetNames(catalog), {
      headers: datasetCacheHeaders(request),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Dataset catalog failed." },
      { status: 500 },
    );
  }
}

