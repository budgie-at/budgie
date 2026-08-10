import { AccountTypeEnum, BankIntegrationEntityInterface, ExternalSourceEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { BANK_PROVIDER_TITLE } from '../../../account/constant/bank-provider-title.constant';
import { useGetAccountsByIntegrationIdQuery } from '../../../account/query/use-get-accounts-by-integration-id.query';
import { BankIntegrationSelector } from '../../../app/(main)/bank-integration/bank-integration.selector';
import { BankIntegrationAccountRow } from '../bank-integration-account-row/bank-integration-account-row';
import { BankIntegrationFooter } from '../bank-integration-footer/bank-integration-footer';

interface Props {
    readonly integration: BankIntegrationEntityInterface;
}

export const BankIntegrationPage = ({ integration }: Props) => {
    const { t } = useLingui();
    const { accounts } = useGetAccountsByIntegrationIdQuery(integration.id);

    const handleAddAccounts = () =>
        void router.push({ pathname: '/bank-integration/[id]/add-accounts', params: { id: String(integration.id) } });
    const handleImportFile = () => void router.push({ pathname: '/create-account/[type]', params: { type: integration.provider } });
    const handleAddDeposit = () =>
        void router.push({
            pathname: '/create-account/[type]',
            params: { type: AccountTypeEnum.DEPOSIT, integrationId: String(integration.id) }
        });

    const isLiveApi = isNotEmptyString(integration.token);
    const canImportFile =
        !isLiveApi && (integration.provider === ExternalSourceEnum.PRIVATBANK || integration.provider === ExternalSourceEnum.ERSTE);
    const titleDescriptor = BANK_PROVIDER_TITLE[integration.provider];
    const title = isDefined(titleDescriptor) ? t(titleDescriptor) : integration.provider;

    const addAccountsButton = isLiveApi ? (
        <Button
            testID={BankIntegrationSelector.AddAccountsButton}
            variant="secondary"
            leftIcon={UserIconNameEnum.CloudDownload}
            content={t`Add accounts`}
            onPress={handleAddAccounts}
            className="flex-1"
        />
    ) : null;
    const importFileButton = canImportFile ? (
        <Button
            testID={BankIntegrationSelector.ImportFileButton}
            variant="secondary"
            leftIcon={UserIconNameEnum.FileSpreadsheet}
            content={t`Import file`}
            onPress={handleImportFile}
            className="flex-1"
        />
    ) : null;
    const secondaryAction = addAccountsButton ?? importFileButton;
    const primaryAction = (
        <Button
            testID={BankIntegrationSelector.AddDepositButton}
            variant="primary"
            leftIcon={UserIconNameEnum.Plus}
            content={t`Add deposit`}
            onPress={handleAddDeposit}
            className="flex-1"
        />
    );

    return (
        <CollapsibleChromePage
            testID={BankIntegrationSelector.Page}
            title={title}
            leading={<HeaderBackButton />}
            contentClassName="gap-y-lg"
            footer={<BankIntegrationFooter primaryAction={primaryAction} secondaryAction={secondaryAction} />}
        >
            {(accounts ?? []).map(account => (
                <BankIntegrationAccountRow key={account.id} account={account} isLiveApi={isLiveApi} />
            ))}
        </CollapsibleChromePage>
    );
};
