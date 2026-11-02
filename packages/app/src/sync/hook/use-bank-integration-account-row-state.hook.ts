import { AccountAssociationEnum, AccountWithInstrumentEntityInterface, ExternalSourceEnum, SyncStatusEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { AccountSyncStateEnum } from '../../account/enum/account-sync-state.enum';
import { getAccountSyncState } from '../../account/utils/get-account-sync-state.util';
import { useBankIntegration } from '../context/bank-integration.context';
import { BankIntegrationSyncStatusEnum } from '../enum/bank-integration-sync-status.enum';
import { useBankIntegrationAccountPreviewsQuery } from '../query/use-bank-integration-account-previews.query';
import { useBankIntegrationSyncsQuery } from '../query/use-bank-integration-syncs.query';
import { getAccountIdentityLabel } from '../utils/get-account-identity-label.util';
import { getBankIntegrationSyncStatus } from '../utils/get-bank-integration-sync-status.util';

import { useAccountSync } from './use-account-sync.hook';

export const useBankIntegrationAccountRowState = (
    account: Pick<AccountWithInstrumentEntityInterface, 'id' | 'title' | 'isActive' | 'iban' | AccountAssociationEnum.INSTRUMENT>
) => {
    const { t } = useLingui();
    const { integration, capabilities } = useBankIntegration();
    const { sync } = useAccountSync(account.id);
    const { isKeyRejected } = useBankIntegrationAccountPreviewsQuery(integration.id);

    const syncs = useBankIntegrationSyncsQuery(integration.id);

    const { title } = account;

    const hasFailed = sync?.status === SyncStatusEnum.FAILED;
    const isRejected = capabilities.supportsLiveSync && isKeyRejected;
    const syncState = getAccountSyncState(sync);
    const hiddenLabel = account.isActive ? '' : t`Hidden from Home`;
    const failureLabel = isRejected ? t`Last attempt failed` : t`Sync failed`;
    const syncIssueLabels: Partial<Record<AccountSyncStateEnum, string>> = {
        [AccountSyncStateEnum.SYNCING]: isRejected ? '' : t`Syncing…`,
        [AccountSyncStateEnum.DISABLED]:
            isRejected || getBankIntegrationSyncStatus(syncs, isRejected, 0) === BankIntegrationSyncStatusEnum.PAUSED ? '' : t`Sync off`
    };
    const liveSyncLabel = capabilities.supportsLiveSync && isDefined(syncState) ? (syncIssueLabels[syncState] ?? '') : '';
    const stateLabel = capabilities.supportsFileImport && sync?.enabled === false ? t`Excluded from imports` : liveSyncLabel;

    return {
        sync,
        isFailed: hasFailed && !isRejected,
        failureLabel: hasFailed ? failureLabel : '',
        switchLabel: capabilities.supportsFileImport ? t`Include ${title} in imports` : t`Sync ${title}`,
        description: [stateLabel, hiddenLabel].filter(isNotEmptyString).join(' · '),
        identityLabel:
            integration.provider === ExternalSourceEnum.BINANCE ? '' : getAccountIdentityLabel(account.instrument.code, account.iban),
        isToggleVisible: isDefined(sync) && (capabilities.supportsLiveSync || capabilities.supportsFileImport)
    };
};
