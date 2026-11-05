import type { SyncHistoryDepthEnum } from '@budgie/sync';

export const SyncHistoryRowSelector = {
    Row: (depth: SyncHistoryDepthEnum) => `SyncHistoryDepthOption.${depth}` as const
} as const;
