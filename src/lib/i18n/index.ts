/**
 * 界面文案中文化。
 *
 * `ui.zh.json` 的键是代码里的英文字符串字面量，值是简体中文；查不到就原样返回英文，
 * 所以词库可以一点点补，没补到的地方不会显示成乱码。
 *
 * 专有名词（物品、机器、配方）在 `names.ts`，服务端已经换好，客户端不用背那份大词表；
 * 只有配方类型名要在界面上单独换，用这里的小表 `recipe-maps.zh.json`。
 */
import uiDictionary from "./ui.zh.json";
import recipeMapDictionary from "./recipe-maps.zh.json";

const UI: Record<string, string> = uiDictionary;
const RECIPE_MAPS: Record<string, string> = recipeMapDictionary;

export function t(english: string): string {
  if (!english) {
    return english;
  }
  return UI[english] ?? UI[english.trim()] ?? english;
}

/** 配方类型名（"Bio Lab" -> "生物实验室"）。查不到原样返回。 */
export function tRecipeMap(name: string): string {
  if (!name) {
    return name;
  }
  return RECIPE_MAPS[name] ?? name;
}

export const ZH_LOCALE = "zh-CN";
