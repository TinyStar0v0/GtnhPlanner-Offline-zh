import { resolveDatasetVersionId } from "@/lib/server/dataset-version";
import { NextResponse } from "next/server";

import { localizeDatasetNames } from "@/lib/i18n/localize";
import { datasetCacheHeaders } from "@/lib/server/dataset-cache-headers";
import { getDatasetRecipe } from "@/lib/server/dataset-query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const versionId = resolveDatasetVersionId(request);
    const recipeId = new URL(request.url).searchParams.get("id") ?? "";
    if (!recipeId) {
      return NextResponse.json({ error: "Recipe not found." }, { status: 404 });
    }
    const recipe = await getDatasetRecipe(versionId, recipeId);
    if (!recipe) {
      return NextResponse.json({ error: "Recipe not found." }, { status: 404 });
    }

    return NextResponse.json(localizeDatasetNames(recipe), {
      headers: datasetCacheHeaders(request),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Recipe load failed." },
      { status: 500 },
    );
  }
}

