import { BankIntegrationEntityInterface, ExternalSourceEnum } from '@budgie/contracts';
import { SYNC_PROVIDER_CAPABILITIES } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';

import { isNotEmptyString } from '@rnw-community/shared';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { SCREEN_CHROME_CONFIG } from '../../../@generic/constant/screen-chrome-config.constant';
import { getBankIntegrationTitle } from '../../../account/utils/get-bank-integration-title.util';
import { BankIntegrationSelector } from '../../../app/(main)/bank-integration/bank-integration.selector';
import { EXTERNAL_SOURCE } from '../../../rule/constant/external-source.constant';
import { BankIntegrationContext } from '../../context/bank-integration.context';
import { BankIntegrationAccountList } from '../bank-integration-account-list/bank-integration-account-list';
import { BankIntegrationKeyCard } from '../bank-integration-key-card/bank-integration-key-card';
import { BankIntegrationOverview } from '../bank-integration-overview/bank-integration-overview';
import { BankIntegrationStatements } from '../bank-integration-statements/bank-integration-statements';

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

    const statements = capabilities.supportsFileImport ? <BankIntegrationStatements /> : null;

    const keyCard = capabilities.supportsAccountDiscovery ? <BankIntegrationKeyCard /> : null;
    const title = getBankIntegrationTitle(t(EXTERNAL_SOURCE[integration.provider]), integration.label, null);

    const contextValue = { integration, capabilities };
    const chromeConfig = { ...SCREEN_CHROME_CONFIG, largeTitleEnd: 32, smallTitleStart: 40 };

    return (
        <GroupedSurface>
            <CollapsibleChromePage
                testID={BankIntegrationSelector.Page}
                title={title}
                leading={<HeaderBackButton />}
                contentClassName="gap-y-3xl"
                scrimClassName="bg-surface"
                chromeConfig={chromeConfig}
            >
                <BankIntegrationContext.Provider value={contextValue}>
                    <BankIntegrationOverview />
                    {statements}
                    {keyCard}
                    <BankIntegrationAccountList />
                </BankIntegrationContext.Provider>
            </CollapsibleChromePage>
        </GroupedSurface>
    );
};
