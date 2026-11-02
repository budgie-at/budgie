import { SyncEntityInterface, SyncStatusEnum } from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { AccountSyncStateEnum } from '../../account/enum/account-sync-state.enum';
import { getAccountSyncState } from '../../account/utils/get-account-sync-state.util';
import { BankIntegrationSyncStatusEnum } from '../enum/bank-integration-sync-status.enum';

export const getBankIntegrationSyncStatus = (
    syncs: Array<Pick<SyncEntityInterface, 'enabled' | 'status' | 'mode' | 'forwardSyncedAt'>>,
    isKeyRejected: boolean,
    now: number
): BankIntegrationSyncStatusEnum => {
    const states = syncs.map(getAccountSyncState);

    if (isKeyRejected) {
        return BankIntegrationSyncStatusEnum.KEY_REJECTED;
    }

    if (states.includes(AccountSyncStateEnum.FAILED) || syncs.some(sync => sync.status === SyncStatusEnum.FAILED)) {
        return BankIntegrationSyncStatusEnum.NEEDS_ATTENTION;
    }

    if (states.includes(AccountSyncStateEnum.SYNCING)) {
        return BankIntegrationSyncStatusEnum.SYNCING;
    }

    if (isNotEmptyArray(states) && states.every(state => state === AccountSyncStateEnum.DISABLED)) {
        return BankIntegrationSyncStatusEnum.PAUSED;
    }

    const latestSync = Math.max(
        ...syncs
            .filter(sync => sync.enabled)
            .map(sync => sync.forwardSyncedAt)
            .filter(isDefined)
            .map(date => date.getTime())
    );
    if (Number.isFinite(latestSync) && now - latestSync > 24 * 60 * 60 * 1000) {
        return BankIntegrationSyncStatusEnum.STALE;
    }

    return BankIntegrationSyncStatusEnum.UP_TO_DATE;
};
