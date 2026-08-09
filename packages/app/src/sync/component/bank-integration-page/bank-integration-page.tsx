import { AccountTypeEnum, BankIntegrationEntityInterface, ExternalSourceEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { ScrollView } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { Page } from '../../../@generic/component/page/page';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { useGetAccountsByIntegrationIdQuery } from '../../../account/query/use-get-accounts-by-integration-id.query';
import { BankIntegrationSelector } from '../../../app/(main)/bank-integration/bank-integration.selector';
import { BankIntegrationAccountRow } from '../bank-integration-account-row/bank-integration-account-row';
import { BankIntegrationHeader } from '../bank-integration-header/bank-integration-header';

interface Props {
    readonly integration: BankIntegrationEntityInterface;
}

export const BankIntegrationPage = ({ integration }: Props) => {
    const { t } = useLingui();
    const { accounts } = useGetAccountsByIntegrationIdQuery(integration.id);

    const handleGoBack = () => void goBackOrReplace('/');
    const handleAddAccounts = () =>
        void router.push({ pathname: '/bank-integration/[id]/add-accounts', params: { id: String(integration.id) } });
    const handleAddDeposit = () =>
        void router.push({
            pathname: '/create-account/[type]',
            params: { type: AccountTypeEnum.DEPOSIT, integrationId: String(integration.id) }
        });

    const canAddAccountsFromBank = integration.provider === ExternalSourceEnum.MONOBANK;

    return (
        <Page
            testID={BankIntegrationSelector.Page}
            header={<BankIntegrationHeader provider={integration.provider} onGoBack={handleGoBack} />}
            contentClassName="px-0"
        >
            <ScrollView contentContainerClassName="px-5xl gap-y-lg pb-7xl">
                {(accounts ?? []).map(account => (
                    <BankIntegrationAccountRow key={account.id} account={account} />
                ))}

                {canAddAccountsFromBank && (
                    <SimpleHorizontalCell
                        testID={BankIntegrationSelector.AddAccountsButton}
                        left={<CircleIcon icon={UserIconNameEnum.CloudDownload} variant="ghost" size={46} iconSize={20} border={false} />}
                        title={t`Add accounts from bank`}
                        onPress={handleAddAccounts}
                    />
                )}

                <SimpleHorizontalCell
                    testID={BankIntegrationSelector.AddDepositButton}
                    left={<CircleIcon icon={UserIconNameEnum.Plus} variant="ghost" size={46} iconSize={20} border={false} />}
                    title={t`Add deposit`}
                    onPress={handleAddDeposit}
                />
            </ScrollView>
        </Page>
    );
};
