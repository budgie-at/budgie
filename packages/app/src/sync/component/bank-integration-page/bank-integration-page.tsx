import { AccountTypeEnum, BankIntegrationEntityInterface, ExternalSourceEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { useGetAccountsByIntegrationIdQuery } from '../../../account/query/use-get-accounts-by-integration-id.query';
import { BankIntegrationSelector } from '../../../app/(main)/bank-integration/bank-integration.selector';
import { EXTERNAL_SOURCE } from '../../../rule/constant/external-source.constant';
import { BankIntegrationAccountRow } from '../bank-integration-account-row/bank-integration-account-row';
import { BankIntegrationFooter } from '../bank-integration-footer/bank-integration-footer';

const PROVIDER_SUPPORTS_DEPOSIT: Record<ExternalSourceEnum, boolean> = {
    [ExternalSourceEnum.MANUAL]: false,
    [ExternalSourceEnum.APPLE_PAY_AUTOMATION]: false,
    [ExternalSourceEnum.MONOBANK]: true,
    [ExternalSourceEnum.PRIVATBANK]: true,
    [ExternalSourceEnum.ERSTE]: true,
    [ExternalSourceEnum.REVOLUT]: true,
    [ExternalSourceEnum.WISE]: true,
    [ExternalSourceEnum.CSV]: true,
    [ExternalSourceEnum.BINANCE]: false,
    [ExternalSourceEnum.COINBASE]: false
};

interface Props {
    readonly integration: BankIntegrationEntityInterface;
}

export const BankIntegrationPage = ({ integration }: Props) => {
    const { t } = useLingui();
    const { accounts } = useGetAccountsByIntegrationIdQuery(integration.id);

    const handleAddAccounts = () => void router.push(`/bank-integration/${integration.id}/add-accounts`);
    const handleImportFile = () => void router.push({ pathname: '/create-account/[type]', params: { type: integration.provider } });
    const handleAddDeposit = () =>
        void router.push({
            pathname: '/create-account/[type]',
            params: { type: AccountTypeEnum.DEPOSIT, integrationId: String(integration.id) }
        });

    const isLiveApi = isNotEmptyString(integration.token);
    const canAddAccounts = isLiveApi && integration.provider === ExternalSourceEnum.MONOBANK;
    const canImportFile =
        !isLiveApi && (integration.provider === ExternalSourceEnum.PRIVATBANK || integration.provider === ExternalSourceEnum.ERSTE);
    const title = t(EXTERNAL_SOURCE[integration.provider]);

    const addAccountsButton = canAddAccounts ? (
        <Button
            testID={BankIntegrationSelector.AddAccountsButton}
            variant="primary"
            leftIcon={UserIconNameEnum.CloudDownload}
            content={t`Add accounts`}
            onPress={handleAddAccounts}
            className="flex-1"
        />
    ) : null;
    const importFileButton = canImportFile ? (
        <Button
            testID={BankIntegrationSelector.ImportFileButton}
            variant="primary"
            leftIcon={UserIconNameEnum.FileSpreadsheet}
            content={t`Import file`}
            onPress={handleImportFile}
            className="flex-1"
        />
    ) : null;
    const primaryAction = addAccountsButton ?? importFileButton;
    const secondaryAction = PROVIDER_SUPPORTS_DEPOSIT[integration.provider] ? (
        <Button
            testID={BankIntegrationSelector.AddDepositButton}
            variant="secondary"
            leftIcon={UserIconNameEnum.Plus}
            content={t`Add deposit`}
            onPress={handleAddDeposit}
            className="flex-1"
        />
    ) : null;
    const footer =
        isDefined(primaryAction) || isDefined(secondaryAction) ? (
            <BankIntegrationFooter primaryAction={primaryAction} secondaryAction={secondaryAction} />
        ) : null;

    return (
        <CollapsibleChromePage
            testID={BankIntegrationSelector.Page}
            title={title}
            leading={<HeaderBackButton />}
            contentClassName="gap-y-lg"
            footer={footer}
        >
            {(accounts ?? []).map(account => (
                <BankIntegrationAccountRow key={account.id} account={account} isLiveApi={isLiveApi} />
            ))}
        </CollapsibleChromePage>
    );
};
