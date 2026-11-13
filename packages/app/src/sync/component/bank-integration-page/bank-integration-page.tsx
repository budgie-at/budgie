import { BankIntegrationEntityInterface, ExternalSourceEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isNotEmptyString } from '@rnw-community/shared';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { getInstitutionTitle } from '../../../account/utils/get-institution-title.util';
import { BankIntegrationSelector } from '../../../app/(main)/bank-integration/bank-integration.selector';
import { BankIntegrationContext } from '../../context/bank-integration.context';
import { getBankIntegrationCapabilities } from '../../utils/get-bank-integration-capabilities.util';
import { BankIntegrationAccountList } from '../bank-integration-account-list/bank-integration-account-list';
import { BankIntegrationKeyCard } from '../bank-integration-key-card/bank-integration-key-card';
import { BankIntegrationOverview } from '../bank-integration-overview/bank-integration-overview';
import { BankIntegrationRenameCard } from '../bank-integration-rename-card/bank-integration-rename-card';
import { BankIntegrationStatements } from '../bank-integration-statements/bank-integration-statements';
import { EnableBankingConnectionCard } from '../enable-banking-connection-card/enable-banking-connection-card';
import { EnableBankingDisconnectRow } from '../enable-banking-disconnect-row/enable-banking-disconnect-row';

interface Props {
    readonly integration: BankIntegrationEntityInterface;
}

export const BankIntegrationPage = ({ integration }: Props) => {
    const { t } = useLingui();

    const capabilities = getBankIntegrationCapabilities(integration);

    const statements = capabilities.supportsFileImport ? <BankIntegrationStatements /> : null;

    const monobankKeyCard = capabilities.supportsAccountDiscovery ? <BankIntegrationKeyCard /> : null;
    const isEnableBanking = integration.provider === ExternalSourceEnum.ENABLE_BANKING;
    const keyCard = isEnableBanking ? <EnableBankingConnectionCard /> : monobankKeyCard;
    const disconnect = isEnableBanking ? <EnableBankingDisconnectRow /> : null;
    const rename = integration.provider === ExternalSourceEnum.MANUAL ? <BankIntegrationRenameCard /> : null;
    const defaultTitle = getInstitutionTitle(t, integration.provider, integration.label, null);
    const title = isEnableBanking && isNotEmptyString(integration.label) ? integration.label : defaultTitle;

    const contextValue = { integration, capabilities };

    return (
        <GroupedSurface>
            <CollapsibleChromePage
                testID={BankIntegrationSelector.Page}
                title={title}
                leading={<HeaderBackButton />}
                contentClassName="gap-y-3xl"
            >
                <BankIntegrationContext.Provider value={contextValue}>
                    <BankIntegrationOverview />
                    {statements}
                    {keyCard}
                    {rename}
                    <BankIntegrationAccountList />
                    {disconnect}
                </BankIntegrationContext.Provider>
            </CollapsibleChromePage>
        </GroupedSurface>
    );
};
