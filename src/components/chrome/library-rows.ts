import type { ShareMode } from "@/components/community/SharePlanDialog";
import { isLiveConfigured } from "@/lib/live/live-config";
import type { MenuEntry } from "./ChromeMenu";

/**
 * The rows that put a plan in the library, in the Share menu and a tab's menu, in the mod's words: a plan not
 * posted yet has Save to library; one posted has Update in library (its own post, votes kept) and Save as new
 * post. A post is a copy: nothing follows the plan by itself. With live plans, Share with people invites people
 * into the plan itself, so posting a copy is Publish to library (the mod's words there too): never one word for both.
 */
/**
 * 自用版没有社区：分享菜单里不再有“发布到社区/更新社区方案”这几行。
 * 保留导出、复制链接、复制方案码这些本地动作。
 */
export function libraryRows(
  _linked: boolean,
  _open: (mode: ShareMode) => void,
  _options: { disabled?: boolean; taskBoard?: boolean } = {},
): MenuEntry[] {
  return [];
}
