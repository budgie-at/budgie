import { LIVE_SYNC_PROVIDERS } from '../constant/live-sync-providers.constant';

import type { SyncEntityInterface } from '@budgie/contracts';

export const isLiveSync = (sync: Pick<SyncEntityInterface, 'enabled' | 'provider'>): boolean =>
    sync.enabled && LIVE_SYNC_PROVIDERS.has(sync.provider);
