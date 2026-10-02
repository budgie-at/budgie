import type { SyncHistoryDepthEnum } from '../../enum/sync-history-depth.enum';

export const SyncHistoryDepthOptionSelector = {
    Row: (depth: SyncHistoryDepthEnum) => `SyncHistoryDepthOption.${depth}` as const
} as const;
