import { BankIntegrationEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { BankIntegrationSelector } from '../../../app/(main)/bank-integration/bank-integration.selector';
import { EXTERNAL_SOURCE } from '../../../rule/constant/external-source.constant';
import { BankIntegrationContext } from '../../context/bank-integration.context';
import { syncProviderRegistryService } from '../../service/sync-provider-registry.service';
import { BankIntegrationAccountList } from '../bank-integration-account-list/bank-integration-account-list';

interface Props {
    readonly integration: BankIntegrationEntityInterface;
}

export const BankIntegrationPage = ({ integration }: Props) => {
    const { t } = useLingui();

    const capabilities = syncProviderRegistryService.getCapabilities(integration);

    const handleAddAccounts = () =>
        void router.push({ pathname: '/bank-integration/[id]/add-accounts', params: { id: String(integration.id) } });
    const handleImportFile = () => void router.push({ pathname: '/create-account/[type]', params: { type: integration.provider } });

    const importFileButton = capabilities.supportsFileImport ? (
        <Button
            testID={BankIntegrationSelector.ImportFileButton}
            variant="primary"
            leftIcon={UserIconNameEnum.FileSpreadsheet}
            content={t`Import file`}
            onPress={handleImportFile}
            className="flex-1"
        />
    ) : null;
    const addAccountsButton = capabilities.supportsAddAccounts ? (
        <Button
            testID={BankIntegrationSelector.AddAccountsButton}
            variant="primary"
            leftIcon={UserIconNameEnum.CloudDownload}
            content={t`Add accounts`}
            onPress={handleAddAccounts}
            className="flex-1"
        />
    ) : null;
    const footerAction = importFileButton ?? addAccountsButton;
    const footer = isDefined(footerAction) ? <View className="flex-row pt-xl px-7xl">{footerAction}</View> : null;

    const contextValue = { integration, capabilities };

    return (
        <CollapsibleChromePage
            testID={BankIntegrationSelector.Page}
            title={t(EXTERNAL_SOURCE[integration.provider])}
            leading={<HeaderBackButton />}
            contentClassName="gap-y-lg"
            footer={footer}
        >
            <BankIntegrationContext.Provider value={contextValue}>
                <BankIntegrationAccountList />
            </BankIntegrationContext.Provider>
        </CollapsibleChromePage>
    );
};
