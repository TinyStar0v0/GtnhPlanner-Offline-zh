/**
 * 物品、流体、机器、配方类型的译名表（约三万四千条，来自 GTNH 官方中文本地化数据）。
 *
 * 这个文件只给服务端和需要查名的组件用：词典有 1.3 MB，别让界面文案的 `t()`
 * 把它拖进每个页面的包里。
 *
 * 查不到整名时按「材料 + 形态」拼一次（"Zircaloy-4 Frame Box" -> 锆锡合金-4框架箱）：
 * GT 和匠魂的零件名几乎都是这个结构，拼出来的比露英文好读。
 */
import nameDictionary from "./names.zh.json";
import materialDictionary from "./materials.zh.json";
import { ASPECT_NAMES_ZH } from "./aspects";

const NAMES: Record<string, string> = nameDictionary;
const MATERIALS: Record<string, string> = materialDictionary;

/**
 * 材料表是从「X Ingot / X Dust」反推的，反推不到的是这些非金属材料和要素，
 * 匠魂的石/木工具、注魔石都要用。
 */
const EXTRA_MATERIALS: Record<string, string> = {
  Stone: "石头",
  Wood: "木头",
  Flint: "燧石",
  Obsidian: "黑曜石",
  Netherrack: "下界岩",
  Bone: "骨头",
  Paper: "纸",
  Cactus: "仙人掌",
  "Sugar Cane": "甘蔗",
  Slime: "史莱姆",
  "Blue Slime": "蓝色史莱姆",
  "Ender Pearl": "末影珍珠",
  Glass: "玻璃",
  Ice: "冰",
  Snow: "雪",
  Sand: "沙子",
  Dirt: "泥土",
  Clay: "黏土",
  Leather: "皮革",
  String: "线",
  Feather: "羽毛",
  Mossy: "苔藓",
  "Magical Wood": "魔法木",
  "Blood Stained": "染血",
  PigIron: "生铁",
  Livingwood: "活木",
  Dreamwood: "梦木",
  Thaumium: "神秘锭",
  Void: "虚空",
};

/** Minecraft 颜色/格式代码，数据集里不少物品名带着它（如 "§61k§r ME ..."）。 */
const FORMATTING_CODE = /§[0-9a-fk-orst]/gi;

/** 前缀形态：整名以它开头，余下部分再当名词翻。 */
const PREFIX_FORMS: Array<[string, string]> = [
  ["Small Pile of", "小堆"],
  ["Tiny Pile of", "极小堆"],
  ["Long ", "长"],
  ["Native ", "原生"],
];

/** 后缀形态，长后缀必须排在短后缀前面（"Hammer Head" 先于 "Head"）。 */
const SUFFIX_FORMS: Array<[string, string]> = [
  // 匠魂 / 格雷工具零件：材料 + 部件名
  ["Hammer Head", "锤头"],
  ["Axe Head", "斧头"],
  ["Chisel Head", "凿头"],
  ["Excavator Head", "挖掘铲头"],
  ["Pickaxe Head", "镐头"],
  ["Scythe Head", "镰刀头"],
  ["Sword Blade", "剑刃"],
  ["Knife Blade", "刀刃"],
  ["Buzzsaw Blade", "圆锯片"],
  ["Saw Blade", "锯片"],
  ["Turbine Blade", "涡轮叶片"],
  ["Drill Tip", "钻头"],
  ["Wrench Tip", "扳手头"],
  ["Chainsaw Tip", "链锯头"],
  ["Full Guard", "全护手"],
  ["Hand Guard", "护手"],
  ["Wide Guard", "宽护手"],
  ["Bow Limb", "弓臂"],
  ["Crossbow Limb", "弩臂"],
  ["Crossbow Body", "弩身"],
  ["Tough Binding", "坚韧绑绳"],
  ["Tool Binding", "工具绑绳"],
  ["Tool Rod", "工具杆"],
  ["Frame Box", "框架箱"],
  ["Arrowhead", "箭头"],
  ["Arrow Head", "箭头"],
  ["Tool / Weapon", "工具/武器"],
  ["Infused Stone", "注魔石"],
  ["Reinforced Stone", "强化石"],
  ["Sheetmetal", "金属板"],
  ["Crossbar", "横杆"],
  ["Shuriken", "手里剑"],
  ["Planks", "木板"],
  ["Cluster", "晶簇"],
  ["Binding", "绑绳"],
  ["Spawner", "刷怪笼"],
  ["Panel", "面板"],
  ["Shard", "碎片"],
  ["Seeds", "种子"],
  ["Blade", "刀刃"],
  ["Guard", "护手"],
  ["Limb", "弓臂"],
  ["Body", "弓身"],
  ["Pane", "玻璃板"],
  ["Dust", "粉"],
  ["Ingot", "锭"],
  ["Plate", "板"],
  ["Nugget", "粒"],
  ["Gear", "齿轮"],
  ["Screw", "螺丝"],
  ["Ring", "环"],
  ["Foil", "箔"],
  ["Bolt", "螺栓"],
  ["Wire", "导线"],
  ["Rod", "杆"],
  ["Cell", "单元"],
  ["Ore", "矿石"],
  ["Block", "方块"],
  ["Bee", "蜜蜂"],
  ["Head", "头部"],
  ["Tip", "尖端"],
  ["Pan", "盘"],
  ["Stone", "石头"],
];

/** 这几个名字是整词，拆开反而翻错。 */
const WHOLE_NAMES: Record<string, string> = {
  "Infused Stone": "注魔石",
  "Reinforced Stone": "强化石",
  "Infested Stone": "虫蚀石",
  "Bose-Einstein Condensate": "玻色-爱因斯坦凝聚体",
};

export function stripFormatting(text: string): string {
  return text.replace(FORMATTING_CODE, "");
}

/** 材料 + 形态拼出来的名字，拼不出返回 undefined。 */
function composeName(english: string): string | undefined {
  const whole = WHOLE_NAMES[english];
  if (whole) {
    return whole;
  }
  if (english.startsWith("Block of ")) {
    const inner = composeName(english.slice("Block of ".length)) ?? NAMES[english.slice("Block of ".length)];
    return inner ? `${inner}块` : undefined;
  }
  for (const [prefix, prefixZh] of PREFIX_FORMS) {
    if (english.startsWith(prefix)) {
      const inner = composeName(english.slice(prefix.length)) ?? NAMES[english.slice(prefix.length)];
      if (inner) {
        return `${prefixZh}${inner}`;
      }
    }
  }
  for (const [suffix, suffixZh] of SUFFIX_FORMS) {
    if (!english.endsWith(` ${suffix}`)) {
      continue;
    }
    const material = english.slice(0, -(suffix.length + 1)).trim();
    // 注魔石的材料是要素（"Aer Infused Stone" = 风之注魔石），
    // 但 "Aer" 在物品表里另有「风之魔晶」的意思，这里必须优先按要素查。
    const materialZh =
      (suffix === "Infused Stone" ? ASPECT_NAMES_ZH[material] : undefined) ??
      MATERIALS[material] ??
      EXTRA_MATERIALS[material] ??
      ASPECT_NAMES_ZH[material];
    if (materialZh) {
      return `${materialZh}${suffixZh}`;
    }
  }
  return undefined;
}

/** 专有名词：整名 -> 组合 -> 退回英文。 */
export function tName(english: string | undefined): string | undefined {
  if (!english) {
    return english;
  }
  const plain = stripFormatting(english).trim();
  return NAMES[plain] ?? NAMES[english] ?? composeName(plain) ?? english;
}

/** 数据集里是否存在这个专有名词的译名（含组合出来的）。 */
export function hasName(english: string | undefined): boolean {
  if (!english) {
    return false;
  }
  const plain = stripFormatting(english).trim();
  return Boolean(NAMES[plain] ?? composeName(plain));
}

/** 中文名反查英文名，给中文搜索用。 */
export function englishNamesFor(chinese: string): string[] {
  const wanted = chinese.trim();
  if (!wanted) {
    return [];
  }
  const hits: string[] = [];
  for (const [english, translated] of Object.entries(NAMES)) {
    if (translated.includes(wanted)) {
      hits.push(english);
    }
  }
  return hits;
}
