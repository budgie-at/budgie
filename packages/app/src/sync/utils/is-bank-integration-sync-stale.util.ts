import { SyncEntityInterface } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { getLatestForwardSyncedAt } from './get-latest-forward-synced-at.util';

const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

export const isBankIntegrationSyncStale = (syncs: readonly Pick<SyncEntityInterface, 'enabled' | 'forwardSyncedAt'>[], now: number) => {
    const lastSyncedAt = getLatestForwardSyncedAt(syncs.filter(sync => sync.enabled));

    return isDefined(lastSyncedAt) && now - lastSyncedAt.getTime() > STALE_AFTER_MS;
};
