import { SyncEntityInterface, SyncStatusEnum } from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { AccountSyncStateEnum } from '../../account/enum/account-sync-state.enum';
import { getAccountSyncState } from '../../account/utils/get-account-sync-state.util';
import { STATEMENT_IMPORT_PROVIDERS } from '../constant/statement-import-providers.constant';
import { BankIntegrationSyncStatusEnum } from '../enum/bank-integration-sync-status.enum';

export const getBankIntegrationSyncStatus = (
    syncs: Array<
        Pick<SyncEntityInterface, 'enabled' | 'status' | 'mode' | 'forwardSyncedAt' | 'provider' | 'reconciledAt' | 'setupBalance'>
    >,
    isKeyRejected: boolean
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

    const isUnanchored = syncs.some(
        sync =>
            sync.enabled &&
            STATEMENT_IMPORT_PROVIDERS.some(provider => provider === sync.provider) &&
            !isDefined(sync.reconciledAt) &&
            !isDefined(sync.setupBalance)
    );

    if (isUnanchored) {
        return BankIntegrationSyncStatusEnum.NEEDS_STATEMENT;
    }

    if (isNotEmptyArray(states) && states.every(state => state === AccountSyncStateEnum.DISABLED)) {
        return BankIntegrationSyncStatusEnum.PAUSED;
    }

    return BankIntegrationSyncStatusEnum.UP_TO_DATE;
};
