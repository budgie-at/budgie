import { isDefined } from '@rnw-community/shared';

import type { SyncEntityInterface } from '@budgie/contracts';

export const getLatestForwardSyncedAt = (syncs: readonly Pick<SyncEntityInterface, 'forwardSyncedAt'>[]): Date | null =>
    syncs
        .map(sync => sync.forwardSyncedAt)
        .filter(isDefined)
        .reduce<Date | null>((latest, syncedAt) => (isDefined(latest) && latest >= syncedAt ? latest : syncedAt), null);
