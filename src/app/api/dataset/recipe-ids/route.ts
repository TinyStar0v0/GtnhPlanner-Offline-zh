import { resolveDatasetVersionId } from "@/lib/server/dataset-version";
import { NextResponse } from "next/server";
import { datasetCacheHeaders } from "@/lib/server/dataset-cache-headers";
import { getDatasetRecipeIds } from "@/lib/server/dataset-query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const versionId = resolveDatasetVersionId(request);
    return NextResponse.json(
      {
        recipeIds: await getDatasetRecipeIds(versionId),
      },
      {
        headers: datasetCacheHeaders(request),
      },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Recipe id list failed." },
      { status: 500 },
    );
  }
}

