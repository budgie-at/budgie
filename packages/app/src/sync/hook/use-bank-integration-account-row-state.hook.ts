import { AccountAssociationEnum, AccountWithInstrumentEntityInterface, ExternalSourceEnum, SyncStatusEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { AccountSyncStateEnum } from '../../account/enum/account-sync-state.enum';
import { getAccountSyncState } from '../../account/utils/get-account-sync-state.util';
import { isListedSecurityType } from '../../instrument/utils/is-listed-security-type.util';
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

    const isRejected = capabilities.supportsLiveSync && isKeyRejected;
    const syncState = getAccountSyncState(sync);
    const syncIssueLabels: Partial<Record<AccountSyncStateEnum, string>> = {
        [AccountSyncStateEnum.SYNCING]: isRejected ? '' : t`Syncing…`,
        [AccountSyncStateEnum.DISABLED]:
            isRejected || getBankIntegrationSyncStatus(syncs, isRejected) === BankIntegrationSyncStatusEnum.PAUSED ? '' : t`Sync off`
    };
    const liveSyncLabel = capabilities.supportsLiveSync && isDefined(syncState) ? (syncIssueLabels[syncState] ?? '') : '';
    const stateLabel = capabilities.supportsFileImport && sync?.enabled === false ? t`Imports off` : liveSyncLabel;

    const stateLabels = [stateLabel, account.isActive ? '' : t`Hidden from Home`].filter(isNotEmptyString).join(' · ');
    const identityLabel =
        integration.provider === ExternalSourceEnum.BINANCE
            ? ''
            : getAccountIdentityLabel(
                  isListedSecurityType(account.instrument.type) ? account.instrument.symbol : account.instrument.code,
                  account.iban
              );

    return {
        sync,
        isFailed: sync?.status === SyncStatusEnum.FAILED,
        leadLabel: isNotEmptyString(stateLabels) ? stateLabels : identityLabel,
        switchLabel: capabilities.supportsFileImport ? t`Include ${title} in imports` : t`Sync ${title}`,
        isToggleVisible: isDefined(sync) && (capabilities.supportsLiveSync || capabilities.supportsFileImport)
    };
};
