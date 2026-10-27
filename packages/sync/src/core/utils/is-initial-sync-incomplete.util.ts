import { SyncModeEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import type { SyncEntityInterface } from '@budgie/contracts';

export const isInitialSyncIncomplete = (sync: Pick<SyncEntityInterface, 'mode' | 'backwardSyncLimitAt' | 'forwardSyncFromAt'>): boolean =>
    sync.mode === SyncModeEnum.BACKWARD &&
    !(isDefined(sync.backwardSyncLimitAt) && isDefined(sync.forwardSyncFromAt) && sync.backwardSyncLimitAt >= sync.forwardSyncFromAt);
