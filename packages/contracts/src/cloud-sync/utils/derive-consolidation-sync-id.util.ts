import { deriveSyncId } from './derive-sync-id.util';

const CONSOLIDATION_NAMESPACE = 'b3d0a4f6-7a3e-4c0e-9f57-2d5a9c6e8b14';

export const deriveConsolidationSyncId = (sourceSyncIds: readonly string[]): string =>
    deriveSyncId(CONSOLIDATION_NAMESPACE, [...new Set(sourceSyncIds)].sort().join('|'));
