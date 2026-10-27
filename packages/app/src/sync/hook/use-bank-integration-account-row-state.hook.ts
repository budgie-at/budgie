import { AccountAssociationEnum, AccountWithInstrumentEntityInterface, SyncStatusEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { AccountSyncStateEnum } from '../../account/enum/account-sync-state.enum';
import { getAccountSyncState } from '../../account/utils/get-account-sync-state.util';
import { useBankIntegration } from '../context/bank-integration.context';
import { getAccountIdentityLabel } from '../utils/get-account-identity-label.util';

import { useAccountSync } from './use-account-sync.hook';

export const useBankIntegrationAccountRowState = (
    account: Pick<AccountWithInstrumentEntityInterface, 'id' | 'isActive' | 'iban' | AccountAssociationEnum.INSTRUMENT>
) => {
    const { t } = useLingui();
    const { capabilities } = useBankIntegration();
    const { sync } = useAccountSync(account.id);

    const switchLabel = capabilities.supportsFileImport ? t`Include in file imports` : t`Sync`;
    const syncState = capabilities.supportsLiveSync ? getAccountSyncState(sync) : null;
    const syncIssueLabels: Partial<Record<AccountSyncStateEnum, string>> = {
        [AccountSyncStateEnum.SYNCING]: t`Syncing…`,
        [AccountSyncStateEnum.DISABLED]: t`Sync paused`
    };

    let description = getAccountIdentityLabel(account.instrument.code, account.iban);
    if (capabilities.supportsLiveSync && sync?.status === SyncStatusEnum.FAILED) {
        description = isNotEmptyString(sync.lastError) ? `${t`Sync Failed`}: ${sync.lastError}` : t`Sync Failed`;
    } else if (!account.isActive) {
        description = t`Hidden from Home`;
    } else if (capabilities.supportsFileImport && sync?.enabled === false) {
        description = t`Excluded from file imports`;
    } else if (isDefined(syncState)) {
        description = syncIssueLabels[syncState] ?? description;
    }

    const isToggleVisible = isDefined(sync) && (capabilities.supportsLiveSync || capabilities.supportsFileImport);

    return { sync, syncState, switchLabel, description, isToggleVisible };
};
