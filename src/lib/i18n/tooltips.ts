/**
 * 物品 tooltip 的中文化。
 *
 * 数据集里有 1.8 万条不同的英文提示行，其中一半是 `Machine Type: X`、`Voltage IN: X`、
 * `Health: 20` 这种「标签：值」的结构，适合规则翻；长段说明留在英文里——
 * 机翻提示比英文更误导。
 */
import { tName } from "./names";
import recipeMapLabels from "./recipe-maps.zh.json";

const RECIPE_MAPS: Record<string, string> = recipeMapLabels;

/** 机器类型值里最常见的几个词。 */
const MACHINE_WORDS: Record<string, string> = {
  Boiler: "锅炉",
  Furnace: "熔炉",
  Generator: "发电机",
  Turbine: "涡轮机",
  Reactor: "反应堆",
  Compressor: "压缩机",
  Mixer: "搅拌机",
  Centrifuge: "离心机",
  Electrolyzer: "电解机",
  Macerator: "研磨机",
  Assembler: "组装机",
  "Chemical Reactor": "化学反应器",
  Extruder: "挤压机",
  "Alloy Smelter": "合金冶炼炉",
  "Arc Furnace": "电弧炉",
  "Blast Furnace": "高炉",
  "Crop Breeder": "作物育种机",
  "Seed Generator": "种子生成器",
  "Crop Gene Extractor": "作物基因提取器",
};

/** 值既可能是物品名，也可能是配方类型名（`Machine Type: Alloy Smelter`）。 */
function translateLabelValue(value: string): string {
  return MACHINE_WORDS[value] ?? RECIPE_MAPS[value] ?? tName(value) ?? value;
}

/** 高频整句。 */
const EXACT: Record<string, string> = {
  "Goes in the Extreme Entity Crusher's controller slot": "放入极界实体粉碎机的控制器槽",
  "CropsNH crop seed": "CropsNH 作物种子",
  "IC2 crop seed": "IC2 作物种子",
  "Stats from the GTNH wiki (not stated in the machine tooltip)": "数据来自 GTNH 维基（机器提示中未写明）",
  "Owner: IC2": "所有者：IC2",
  "Imported from machine catalyst tooltip": "来自机器催化剂提示",
  "Added by bartimaeusnek via BartWorks": "由 bartimaeusnek 通过 BartWorks 添加",
  "Industrial Coke Oven width": "工业焦炉宽度",
  "Gains 4 Parallels per Coil Tier": "每级线圈 +4 并行",
  "Heating coil tier": "加热线圈等级",
  "Supports Multi-Amp and Laser Hatches!": "支持多安培仓与激光仓！",
  "HighTech combination Smelter": "高科技联合冶炼炉",
  "Where Machines go to retire": "机器退休的地方",
  "Generates more seeds from an existing seed": "从已有种子生成更多种子",
  "Not all crops can be replicated in this machine": "并非所有作物都能在这台机器里复制",
  "Breeds crops deterministically": "可确定性地培育作物",
  "High-Pressure Doubles Speed and Steam Usage": "高压：速度翻倍，蒸汽消耗翻倍",
  "The BioLab, a Multi-Use Bioengineering Station": "生物实验室，多用途生物工程站",
  "Module of the Nanochip Assembly Complex": "纳米芯片组装复合体的模块",
  "It can extract Crop Genes": "可提取作物基因",
  "Use a programmed circuit to determine which gene to extract": "用编程电路决定提取哪段基因",
  "Parallels are the cube root of the laser source amperage (GTNH wiki)":
    "并行数是激光源电流的立方根（GTNH 维基）",
  "100% EU Usage": "EU 消耗 100%",
  "Not used up": "不消耗",
  "not used up": "不消耗",
  "Cannot be crafted": "无法合成",
  "DEPRECATED - Controller will be removed in next major update!":
    "已弃用：控制器将在下个大版本移除！",
  "Check NEI for new Controller and conversion recipe": "在 NEI 里查看新控制器与转换配方",
  "Creative only": "仅创造模式",
};

/** 「标签：值」结构，值是名字时再查一次名词表。 */
const LABELS: Array<[RegExp, string, boolean]> = [
  [/^Machine Type: (.+)$/, "机器类型：$1", true],
  [/^Voltage IN: (.+)$/, "输入电压：$1", false],
  [/^Voltage OUT: (.+)$/, "输出电压：$1", false],
  [/^Capacity: (.+)$/, "容量：$1", false],
  [/^Power Usage: (.+)$/, "功率消耗：$1", false],
  [/^Base Amperage: (.+)$/, "基础电流：$1", false],
  [/^Health: (\d+)$/, "生命值：$1", false],
  [/^Stores (.+) of fluid$/, "储存 $1 流体", false],
  [/^Owner: (.+)$/, "所有者：$1", false],
  [/^Coil Tier: (.+)$/, "线圈等级：$1", false],
  [/^Tier: (.+)$/, "等级：$1", false],
  [/^EU Usage: (.+)$/, "EU 消耗：$1", false],
  [/^Steam Usage: (.+)$/, "蒸汽消耗：$1", false],
];

export function translateTooltipLine(line: string): string {
  const trimmed = line.trim();
  if (!trimmed) {
    return line;
  }
  const exact = EXACT[trimmed];
  if (exact) {
    return line.replace(trimmed, exact);
  }
  for (const [pattern, template, translateValue] of LABELS) {
    const match = pattern.exec(trimmed);
    if (!match) {
      continue;
    }
    let value = match[1];
    if (translateValue) {
      value = translateLabelValue(value);
    }
    return line.replace(trimmed, template.replace("$1", value));
  }
  return line;
}

export function translateTooltip(lines: string[], displayName?: string): string[] {
  const nameZh = displayName ? tName(displayName) : undefined;
  return lines.map((line, index) => {
    // 提示的第一行常常就是物品名本身
    if (index === 0 && nameZh && line.trim() === displayName?.trim()) {
      return line.replace(line.trim(), nameZh);
    }
    return translateTooltipLine(line);
  });
}
