import { SyncStatusEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';

import type { BuildSyncStatusLabelInputInterface } from '../interface/build-sync-status-label-input.interface';

export const buildSyncStatusLabel = ({ status, isForwardMode, isSyncing }: BuildSyncStatusLabelInputInterface): string => {
    if (status === SyncStatusEnum.FAILED) {
        return t`Sync Failed`;
    }

    if (isSyncing) {
        return isForwardMode ? t`Fetching new...` : t`Syncing history...`;
    }

    if (isForwardMode) {
        return t`Up to date`;
    }

    return t`Waiting`;
};
