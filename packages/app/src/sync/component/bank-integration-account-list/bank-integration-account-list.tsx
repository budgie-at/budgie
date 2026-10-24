import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { View } from 'react-native';

import { isDefined, isEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { DashedActionRow } from '../../../@generic/component/dashed-action-row/dashed-action-row';
import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { useGetAccountsByIntegrationIdQuery } from '../../../account/query/use-get-accounts-by-integration-id.query';
import { BankIntegrationSelector } from '../../../app/(main)/bank-integration/bank-integration.selector';
import { SettingsGroup } from '../../../settings/components/settings-group/settings-group';
import { useBankIntegration } from '../../context/bank-integration.context';
import { BankIntegrationAccountRowSkeleton } from '../bank-integration-account-row-skeleton/bank-integration-account-row-skeleton';
import { BankIntegrationAccountRow } from '../bank-integration-account-row/bank-integration-account-row';
import { BankIntegrationNewAccounts } from '../bank-integration-new-accounts/bank-integration-new-accounts';
import { BankIntegrationStatusBanner } from '../bank-integration-status-banner/bank-integration-status-banner';

export const BankIntegrationAccountList = () => {
    const { t } = useLingui();
    const { integration, capabilities } = useBankIntegration();
    const { accounts, error } = useGetAccountsByIntegrationIdQuery(integration.id);

    const handleAddDeposit = () =>
        void router.push({
            pathname: '/create-account/[type]',
            params: { type: AccountTypeEnum.DEPOSIT, integrationId: String(integration.id) }
        });

    const addDepositRow = capabilities.supportsDeposit ? (
        <DashedActionRow icon={UserIconNameEnum.Plus} onPress={handleAddDeposit} testID={BankIntegrationSelector.AddDepositButton}>
            <Trans>Add deposit</Trans>
        </DashedActionRow>
    ) : null;

    if (isDefined(error)) {
        return (
            <SettingsGroup title={t`Accounts`}>
                <BankIntegrationStatusBanner
                    variant="warning"
                    text={t`Could not load accounts`}
                    testID={BankIntegrationSelector.ErrorState}
                />
                {addDepositRow}
            </SettingsGroup>
        );
    }

    if (!isDefined(accounts)) {
        return (
            <SettingsGroup title={t`Accounts`}>
                <BankIntegrationAccountRowSkeleton />
                <BankIntegrationAccountRowSkeleton />
            </SettingsGroup>
        );
    }

    const linkedExternalIds = new Set(accounts.map(account => account.externalId).filter(isNotEmptyString));
    const newAccounts = capabilities.supportsAccountDiscovery ? <BankIntegrationNewAccounts linkedExternalIds={linkedExternalIds} /> : null;
    const linkedAccounts = isEmptyArray(accounts) ? (
        <EmptyState
            title={t`No accounts in this integration yet`}
            description={t`Accounts you sync or import appear here.`}
            testID={BankIntegrationSelector.EmptyState}
        />
    ) : (
        <View className="gap-y-lg">
            {accounts.map(account => (
                <BankIntegrationAccountRow key={account.id} account={account} />
            ))}
        </View>
    );
    const title = isEmptyArray(accounts) ? t`Accounts` : t`Accounts · ${accounts.length}`;

    return (
        <SettingsGroup title={title}>
            {linkedAccounts}
            {newAccounts}
            {addDepositRow}
        </SettingsGroup>
    );
};
