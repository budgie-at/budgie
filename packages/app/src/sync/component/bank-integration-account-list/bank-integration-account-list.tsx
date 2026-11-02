import { ExternalSourceEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined, isEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { useGetAccountsByIntegrationIdQuery } from '../../../account/query/use-get-accounts-by-integration-id.query';
import { BankIntegrationSelector } from '../../../app/(main)/bank-integration/bank-integration.selector';
import { useBankIntegration } from '../../context/bank-integration.context';
import { BankIntegrationAccountRowSkeleton } from '../bank-integration-account-row-skeleton/bank-integration-account-row-skeleton';
import { BankIntegrationAccountRow } from '../bank-integration-account-row/bank-integration-account-row';
import { BankIntegrationAddDeposit } from '../bank-integration-add-deposit/bank-integration-add-deposit';
import { BankIntegrationEmptyAccounts } from '../bank-integration-empty-accounts/bank-integration-empty-accounts';
import { BankIntegrationNewAccounts } from '../bank-integration-new-accounts/bank-integration-new-accounts';

export const BankIntegrationAccountList = () => {
    const { t } = useLingui();
    const { integration, capabilities } = useBankIntegration();
    const { accounts, error } = useGetAccountsByIntegrationIdQuery(integration.id);
    const footer = capabilities.supportsFileImport
        ? t`Switched-off accounts are skipped when you import a statement.`
        : t`Switched-off accounts stop syncing. Their history stays.`;

    if (isDefined(error)) {
        return (
            <GroupedListSection title={t`Accounts`} footer={footer}>
                <GroupedListRow
                    title={
                        <Text className="text-[17px] text-destructive-foreground">
                            <Trans>Could not load accounts</Trans>
                        </Text>
                    }
                    testID={BankIntegrationSelector.ErrorState}
                />
                <BankIntegrationAddDeposit />
            </GroupedListSection>
        );
    }
    if (!isDefined(accounts)) {
        return (
            <GroupedListSection title={t`Accounts`} footer={footer}>
                <BankIntegrationAccountRowSkeleton />
                <BankIntegrationAccountRowSkeleton />
            </GroupedListSection>
        );
    }
    const newAccounts = capabilities.supportsAccountDiscovery ? (
        <BankIntegrationNewAccounts linkedExternalIds={new Set(accounts.map(account => account.externalId).filter(isNotEmptyString))} />
    ) : null;
    const linkedAccounts = isEmptyArray(accounts) ? (
        <BankIntegrationEmptyAccounts />
    ) : (
        accounts.map(account => <BankIntegrationAccountRow key={account.id} account={account} />)
    );
    const accountCount = accounts.length;
    const countTitle = integration.provider === ExternalSourceEnum.BINANCE ? t`Assets · ${accountCount}` : t`Accounts · ${accountCount}`;
    const title = isEmptyArray(accounts) ? t`Accounts` : countTitle;
    const accountsFooter = isEmptyArray(accounts) ? null : footer;

    return (
        <>
            {newAccounts}
            <GroupedListSection title={title} footer={accountsFooter}>
                {linkedAccounts}
                <BankIntegrationAddDeposit />
            </GroupedListSection>
        </>
    );
};
