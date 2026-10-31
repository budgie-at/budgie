import { SyncEntityInterface, SyncWarningEnum } from '@budgie/contracts';

import { isNotEmptyString } from '@rnw-community/shared';

export const hasSyncProblem = (sync: Pick<SyncEntityInterface, 'lastError' | 'lastWarning'>): boolean =>
    isNotEmptyString(sync.lastError) && sync.lastWarning !== SyncWarningEnum.REGION_UNAVAILABLE;
