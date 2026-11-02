import { AccountAssociationEnum, AccountWithInstrumentEntityInterface, ExternalSourceEnum, SyncStatusEnum } from '@budgie/contracts';
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

    const syncState = sync?.status === SyncStatusEnum.FAILED ? AccountSyncStateEnum.FAILED : getAccountSyncState(sync);
    const syncIssueLabels: Partial<Record<AccountSyncStateEnum, string>> = {
        [AccountSyncStateEnum.SYNCING]: t`Syncing…`,
        [AccountSyncStateEnum.DISABLED]: t`Sync off`
    };

    let description = '';
    if (sync?.status === SyncStatusEnum.FAILED) {
        const { lastError } = sync;
        description = isNotEmptyString(lastError) ? t`Sync failed · ${lastError}` : t`Sync failed`;
    } else if (capabilities.supportsLiveSync && isKeyRejected) {
        description = t`Paused until the key is updated`;
    } else if (!account.isActive) {
        description = t`Hidden from Home`;
    } else if (capabilities.supportsFileImport && sync?.enabled === false) {
        description = t`Excluded from imports`;
    } else if (capabilities.supportsLiveSync && isDefined(syncState)) {
        description = syncIssueLabels[syncState] ?? description;
    }

    return {
        sync,
        syncState,
        switchLabel: capabilities.supportsFileImport ? t`Include in file imports` : t`Sync`,
        description,
        identityLabel:
            integration.provider === ExternalSourceEnum.BINANCE ? '' : getAccountIdentityLabel(account.instrument.code, account.iban),
        isToggleVisible: isDefined(sync) && (capabilities.supportsLiveSync || capabilities.supportsFileImport)
    };
};
