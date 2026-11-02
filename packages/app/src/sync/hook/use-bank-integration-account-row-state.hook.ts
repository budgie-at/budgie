import { AccountAssociationEnum, AccountWithInstrumentEntityInterface, SyncStatusEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { AccountSyncStateEnum } from '../../account/enum/account-sync-state.enum';
import { getAccountSyncState } from '../../account/utils/get-account-sync-state.util';
import { useBankIntegration } from '../context/bank-integration.context';
import { useBankIntegrationAccountPreviewsQuery } from '../query/use-bank-integration-account-previews.query';
import { getAccountIdentityLabel } from '../utils/get-account-identity-label.util';

import { useAccountSync } from './use-account-sync.hook';

export const useBankIntegrationAccountRowState = (
    account: Pick<AccountWithInstrumentEntityInterface, 'id' | 'isActive' | 'iban' | AccountAssociationEnum.INSTRUMENT>
) => {
    const { t } = useLingui();
    const { integration, capabilities } = useBankIntegration();
    const { sync } = useAccountSync(account.id);
    const { isKeyRejected } = useBankIntegrationAccountPreviewsQuery(integration.id);

    const syncState = capabilities.supportsLiveSync ? getAccountSyncState(sync) : null;
    const syncIssueLabels: Partial<Record<AccountSyncStateEnum, string>> = {
        [AccountSyncStateEnum.SYNCING]: t`Syncing…`,
        [AccountSyncStateEnum.DISABLED]: t`Sync off`
    };

    let description = getAccountIdentityLabel(account.instrument.code, account.iban);
    if (capabilities.supportsLiveSync && isKeyRejected) {
        description = t`Paused · key rejected`;
    } else if (capabilities.supportsLiveSync && sync?.status === SyncStatusEnum.FAILED) {
        const { lastError } = sync;
        description = isNotEmptyString(lastError) ? t`Sync failed · ${lastError}` : t`Sync failed`;
    } else if (!account.isActive) {
        description = t`Hidden from Home`;
    } else if (capabilities.supportsFileImport && sync?.enabled === false) {
        description = t`Excluded from imports`;
    } else if (isDefined(syncState)) {
        description = syncIssueLabels[syncState] ?? description;
    }

    return {
        sync,
        syncState,
        switchLabel: capabilities.supportsFileImport ? t`Include in file imports` : t`Sync`,
        description,
        isToggleVisible: isDefined(sync) && (capabilities.supportsLiveSync || capabilities.supportsFileImport)
    };
};
