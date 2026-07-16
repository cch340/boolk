// Shared message-key contract. `en.ts` is the canonical key set; the union and
// the `Messages` type are derived from it so `zh.ts`/`ja.ts` are checked for
// completeness (missing or extra keys become type errors).

import { en } from "./en";

export type MessageKey = keyof typeof en;

export type Messages = Record<MessageKey, string>;

/** Runtime list of every message key (used by parity checks / tooling). */
export const MESSAGE_KEYS = Object.keys(en) as MessageKey[];
