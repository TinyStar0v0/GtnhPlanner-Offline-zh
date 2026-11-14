/**
 * 数据集里的英文名换成中文，服务端统一做一遍。
 *
 * 数据集返回的对象树很大（catalog 有六万多条资源），所以原地改写而不是复制：
 * 这些 JSON 是刚解析出来的、归本进程所有，改完就是缓存里的那一份。
 */
import { tName } from "@/lib/i18n/names";
import { ASPECT_NAMES_ZH } from "@/lib/i18n/aspects";
import recipeMapLabels from "./recipe-maps.zh.json";
import { translateTooltip } from "./tooltips";

const RECIPE_MAPS: Record<string, string> = recipeMapLabels;

type Json = unknown;

export function localizeDatasetNames<T>(payload: T): T {
  walk(payload);
  return payload;
}

/**
 * 配方名形如 "Alloy Blast Smelter: Molten Ancient Granite"：
 * 冒号前是配方类型，冒号后是产物名，两半各查各的表。
 */
function localizeRecipeName(name: string): string {
  const split = name.indexOf(": ");
  if (split <= 0) {
    return tName(name) ?? name;
  }
  const map = name.slice(0, split);
  const rest = name.slice(split + 2);
  const mapZh = RECIPE_MAPS[map];
  return mapZh ? `${mapZh}：${tName(rest) ?? rest}` : name;
}

function walk(value: Json): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      walk(item);
    }
    return;
  }
  if (!value || typeof value !== "object") {
    return;
  }
  const record = value as Record<string, unknown>;
  const displayName = record.displayName;
  const originalName = typeof displayName === "string" ? displayName : undefined;
  if (typeof displayName === "string") {
    // 要素与物品可能同名（"Aer" 既是「风」也是「风之魔晶」），要素单独查表。
    const aspect = record.kind === "aspect" ? ASPECT_NAMES_ZH[displayName] : undefined;
    // 已经是中文时 tName 原样返回，重复调用无害（catalog 是缓存对象）。
    record.displayName = aspect ?? tName(displayName);
  }
  // 只动配方对象的名字（带 recipeMap / machineType 的），别碰方案名之类的用户数据。
  if (
    typeof record.name === "string" &&
    (typeof record.recipeMap === "string" || typeof record.machineType === "string")
  ) {
    record.name = localizeRecipeName(record.name);
  }
  // tooltip 是提示行数组，结构化行翻译，长段说明保留英文。
  if (Array.isArray(record.tooltip) && record.tooltip.every((line) => typeof line === "string")) {
    record.tooltip = translateTooltip(record.tooltip as string[], originalName);
  }
  for (const key in record) {
    if (key === "displayName" || key === "name" || key === "tooltip") {
      continue;
    }
    walk(record[key]);
  }
}
