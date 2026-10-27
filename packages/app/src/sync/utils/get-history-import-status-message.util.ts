import { SyncStatusEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';

import type { SyncEntityInterface } from '@budgie/contracts';

export const getHistoryImportStatusMessage = (sync: Pick<SyncEntityInterface, 'enabled' | 'status'>) => {
    if (sync.status === SyncStatusEnum.FAILED) {
        return msg`History import needs attention`;
    }

    if (!sync.enabled) {
        return msg`History import paused`;
    }

    return msg`Importing history`;
};
