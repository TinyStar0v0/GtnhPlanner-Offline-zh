import { assertLocalDbAllowed } from "./local-db/client";

/**
 * What the website's server checks as it starts (src/instrumentation.ts).
 *
 * 本地版没有账户与社区：`COMMUNITY_HASH_SALT` 这个会话密钥的检查一并去掉，
 * 否则每次启动都会打一条听着像报错的警告。
 */
export function checkServerSetup(_warn: (message: string) => void = console.warn): void {
  assertLocalDbAllowed();
}
