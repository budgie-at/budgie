import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';

import { getErrorMessage, isDefined, isEmptyArray } from '@rnw-community/shared';

import { DashedActionRow } from '../../../@generic/component/dashed-action-row/dashed-action-row';
import { useGetAccountsByIntegrationIdQuery } from '../../../account/query/use-get-accounts-by-integration-id.query';
import { BankIntegrationSelector } from '../../../app/(main)/bank-integration/bank-integration.selector';
import { useBankIntegration } from '../../context/bank-integration.context';
import { BankIntegrationAccountRow } from '../bank-integration-account-row/bank-integration-account-row';

export const BankIntegrationAccountList = () => {
    const { t } = useLingui();
    const { integration, capabilities } = useBankIntegration();
    const { accounts, error } = useGetAccountsByIntegrationIdQuery(integration.id);

    const handleAddDeposit = () =>
        void router.push({
            pathname: '/create-account/[type]',
            params: { type: AccountTypeEnum.DEPOSIT, integrationId: String(integration.id) }
        });

    if (isDefined(error)) {
        return (
            <View className="items-center gap-y-xs py-3xl" testID={BankIntegrationSelector.ErrorState}>
                <Text className="text-primary text-sm font-medium">{t`Could not load accounts`}</Text>
                <Text className="text-secondary-foreground text-xs">{getErrorMessage(error)}</Text>
            </View>
        );
    }

    if (!isDefined(accounts)) {
        return <ActivityIndicator size="large" color="var(--color-primary)" />;
    }

    const addDepositRow = capabilities.supportsDeposit ? (
        <DashedActionRow icon={UserIconNameEnum.Plus} onPress={handleAddDeposit} testID={BankIntegrationSelector.AddDepositButton}>
            <Trans>Add deposit</Trans>
        </DashedActionRow>
    ) : null;

    if (isEmptyArray(accounts)) {
        return (
            <>
                <Text className="text-secondary-foreground py-3xl text-center text-sm" testID={BankIntegrationSelector.EmptyState}>
                    {t`No accounts in this integration yet`}
                </Text>
                {addDepositRow}
            </>
        );
    }

    return (
        <>
            {accounts.map(account => (
                <BankIntegrationAccountRow key={account.id} account={account} />
            ))}
            {addDepositRow}
        </>
    );
};
