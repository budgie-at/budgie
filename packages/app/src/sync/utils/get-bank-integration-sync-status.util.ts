import { SyncEntityInterface, SyncStatusEnum } from '@budgie/contracts';

import { isNotEmptyArray } from '@rnw-community/shared';

import { AccountSyncStateEnum } from '../../account/enum/account-sync-state.enum';
import { getAccountSyncState } from '../../account/utils/get-account-sync-state.util';
import { BankIntegrationSyncStatusEnum } from '../enum/bank-integration-sync-status.enum';

export const getBankIntegrationSyncStatus = (
    syncs: Array<Pick<SyncEntityInterface, 'enabled' | 'status' | 'mode'>>,
    isKeyRejected: boolean
): BankIntegrationSyncStatusEnum => {
    const states = syncs.map(getAccountSyncState);

    if (states.includes(AccountSyncStateEnum.FAILED) || syncs.some(sync => sync.status === SyncStatusEnum.FAILED)) {
        return BankIntegrationSyncStatusEnum.NEEDS_ATTENTION;
    }

    if (isKeyRejected) {
        return BankIntegrationSyncStatusEnum.KEY_REJECTED;
    }

    if (states.includes(AccountSyncStateEnum.SYNCING)) {
        return BankIntegrationSyncStatusEnum.SYNCING;
    }

    if (isNotEmptyArray(states) && states.every(state => state === AccountSyncStateEnum.DISABLED)) {
        return BankIntegrationSyncStatusEnum.PAUSED;
    }

    return BankIntegrationSyncStatusEnum.UP_TO_DATE;
};
