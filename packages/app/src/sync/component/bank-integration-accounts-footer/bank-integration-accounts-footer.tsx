import { ExternalSourceEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined, isEmptyArray } from '@rnw-community/shared';

import { useGetAccountsByIntegrationIdQuery } from '../../../account/query/use-get-accounts-by-integration-id.query';
import { useBankIntegration } from '../../context/bank-integration.context';
import { useBankIntegrationAccountPreviewsQuery } from '../../query/use-bank-integration-account-previews.query';

export const BankIntegrationAccountsFooter = () => {
    const { t } = useLingui();
    const { integration, capabilities } = useBankIntegration();
    const { accounts } = useGetAccountsByIntegrationIdQuery(integration.id);
    const { isKeyRejected } = useBankIntegrationAccountPreviewsQuery(integration.id);
    const isEmpty = isDefined(accounts) && isEmptyArray(accounts);
    const accountsFooter = capabilities.supportsFileImport
        ? t`Switched-off accounts are skipped on import.`
        : t`Switched-off accounts stop syncing. History stays.`;
    const providerFooter =
        integration.provider === ExternalSourceEnum.BINANCE ? t`Switched-off assets stop syncing. History stays.` : accountsFooter;
    const populatedFooter =
        capabilities.supportsLiveSync && isKeyRejected ? t`Syncing resumes for all accounts once you update the key.` : providerFooter;
    const footer = isEmpty ? t`Accounts you sync appear here.` : populatedFooter;

    if (isEmpty && capabilities.supportsFileImport) {
        return null;
    }

    return <Text className="text-secondary-foreground px-3xl pt-md text-[13px] leading-[18px]">{footer}</Text>;
};
