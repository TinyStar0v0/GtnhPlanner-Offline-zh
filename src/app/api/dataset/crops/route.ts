import { resolveDatasetVersionId } from "@/lib/server/dataset-version";
import { NextResponse } from "next/server";

import { localizeDatasetNames } from "@/lib/i18n/localize";
import { datasetCacheHeaders } from "@/lib/server/dataset-cache-headers";
import { listDatasetCropFarmRecipes } from "@/lib/server/dataset-query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const versionId = resolveDatasetVersionId(request);
    const result = await listDatasetCropFarmRecipes(versionId);
    return NextResponse.json(localizeDatasetNames(result), {
      headers: datasetCacheHeaders(request),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Crop query failed." },
      { status: 500 },
    );
  }
}
