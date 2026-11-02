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
    account: Pick<AccountWithInstrumentEntityInterface, 'id' | 'title' | 'isActive' | 'iban' | AccountAssociationEnum.INSTRUMENT>
) => {
    const { t } = useLingui();
    const { integration, capabilities } = useBankIntegration();
    const { sync } = useAccountSync(account.id);
    const { isKeyRejected } = useBankIntegrationAccountPreviewsQuery(integration.id);

    const isFailureDescription = sync?.status === SyncStatusEnum.FAILED;
    const isRejected = capabilities.supportsLiveSync && isKeyRejected;
    const syncState = getAccountSyncState(sync);
    const hiddenLabel = account.isActive ? '' : t`Hidden from Home`;
    const failureLabel = isRejected ? t`Last attempt failed` : t`Sync failed`;
    const syncIssueLabels: Partial<Record<AccountSyncStateEnum, string>> = {
        [AccountSyncStateEnum.SYNCING]: isRejected ? '' : t`Syncing…`,
        [AccountSyncStateEnum.DISABLED]: t`Sync off`
    };
    const liveSyncLabel = capabilities.supportsLiveSync && isDefined(syncState) ? (syncIssueLabels[syncState] ?? '') : '';
    const stateLabel = capabilities.supportsFileImport && sync?.enabled === false ? t`Excluded from imports` : liveSyncLabel;
    const failureDescription = [failureLabel, sync?.lastError].filter(isNotEmptyString).join(' · ');

    return {
        sync,
        isFailed: isFailureDescription && !isRejected,
        isFailureDescription,
        hiddenLabel: isFailureDescription ? hiddenLabel : '',
        switchLabel: capabilities.supportsFileImport ? t`Include ${account.title} in imports` : t`Sync ${account.title}`,
        description: isFailureDescription ? failureDescription : [stateLabel, hiddenLabel].filter(isNotEmptyString).join(' · '),
        identityLabel:
            integration.provider === ExternalSourceEnum.BINANCE ? '' : getAccountIdentityLabel(account.instrument.code, account.iban),
        isToggleVisible: isDefined(sync) && (capabilities.supportsLiveSync || capabilities.supportsFileImport)
    };
};
