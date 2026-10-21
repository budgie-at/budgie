import { BankIntegrationEntityInterface, ExternalSourceEnum, UserIconNameEnum } from '@budgie/contracts';
import { SYNC_PROVIDER_CAPABILITIES } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { Card } from '../../../@generic/component/card/card';
import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { getBankIntegrationTitle } from '../../../account/utils/get-bank-integration-title.util';
import { BankIntegrationSelector } from '../../../app/(main)/bank-integration/bank-integration.selector';
import { EXTERNAL_SOURCE } from '../../../rule/constant/external-source.constant';
import { BankIntegrationContext } from '../../context/bank-integration.context';
import { BankIntegrationAccountList } from '../bank-integration-account-list/bank-integration-account-list';
import { BankIntegrationNameSection } from '../bank-integration-name-section/bank-integration-name-section';
import { SyncTokenSection } from '../sync-token-section/sync-token-section';

interface Props {
    readonly integration: BankIntegrationEntityInterface;
}

export const BankIntegrationPage = ({ integration }: Props) => {
    const { t } = useLingui();

    const providerCapabilities = SYNC_PROVIDER_CAPABILITIES[integration.provider];
    const hasToken = isNotEmptyString(integration.token);
    const supportsLiveSync = hasToken && providerCapabilities.supportsTokenAuth;
    const capabilities = {
        supportsLiveSync,
        supportsFileImport: !hasToken && providerCapabilities.supportsFileImport,
        supportsAccountDiscovery: supportsLiveSync && integration.provider === ExternalSourceEnum.MONOBANK,
        supportsDeposit: providerCapabilities.supportsDeposit
    };

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
    const footer = isDefined(importFileButton) ? <View className="flex-row pt-xl px-7xl">{importFileButton}</View> : null;

    const connectionCard = capabilities.supportsAccountDiscovery ? (
        <Card className="gap-y-lg">
            <BankIntegrationNameSection />
            <SyncTokenSection />
        </Card>
    ) : null;
    const title = getBankIntegrationTitle(t(EXTERNAL_SOURCE[integration.provider]), integration.label, null);

    const contextValue = { integration, capabilities };

    return (
        <CollapsibleChromePage
            testID={BankIntegrationSelector.Page}
            title={title}
            leading={<HeaderBackButton />}
            contentClassName="gap-y-lg"
            footer={footer}
        >
            <BankIntegrationContext.Provider value={contextValue}>
                {connectionCard}
                <BankIntegrationAccountList />
            </BankIntegrationContext.Provider>
        </CollapsibleChromePage>
    );
};
