import type { SyncHistoryDepthEnum } from '@budgie/sync';

export const SyncHistoryDepthOptionSelector = {
    Row: (depth: SyncHistoryDepthEnum) => `SyncHistoryDepthOption.${depth}` as const
} as const;
