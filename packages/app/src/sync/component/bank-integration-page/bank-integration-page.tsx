import { BankIntegrationEntityInterface, ExternalSourceEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { getBankIntegrationTitle } from '../../../account/utils/get-bank-integration-title.util';
import { BankIntegrationSelector } from '../../../app/(main)/bank-integration/bank-integration.selector';
import { EXTERNAL_SOURCE } from '../../../rule/constant/external-source.constant';
import { BankIntegrationContext } from '../../context/bank-integration.context';
import { getBankIntegrationCapabilities } from '../../utils/get-bank-integration-capabilities.util';
import { BankIntegrationAccountList } from '../bank-integration-account-list/bank-integration-account-list';
import { BankIntegrationKeyCard } from '../bank-integration-key-card/bank-integration-key-card';
import { BankIntegrationOverview } from '../bank-integration-overview/bank-integration-overview';
import { BankIntegrationStatements } from '../bank-integration-statements/bank-integration-statements';
import { EnableBankingConnectionCard } from '../enable-banking-connection-card/enable-banking-connection-card';

interface Props {
    readonly integration: BankIntegrationEntityInterface;
}

export const BankIntegrationPage = ({ integration }: Props) => {
    const { t } = useLingui();

    const capabilities = getBankIntegrationCapabilities(integration);

    const statements = capabilities.supportsFileImport ? <BankIntegrationStatements /> : null;

    const monobankKeyCard = capabilities.supportsAccountDiscovery ? <BankIntegrationKeyCard /> : null;
    const keyCard = integration.provider === ExternalSourceEnum.ENABLE_BANKING ? <EnableBankingConnectionCard /> : monobankKeyCard;
    const title = getBankIntegrationTitle(t(EXTERNAL_SOURCE[integration.provider]), integration.label, null);

    const contextValue = { integration, capabilities };

    return (
        <GroupedSurface>
            <CollapsibleChromePage
                testID={BankIntegrationSelector.Page}
                title={title}
                leading={<HeaderBackButton />}
                contentClassName="gap-y-3xl"
                scrimClassName="bg-surface"
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
