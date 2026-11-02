import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { BankIntegrationSelector } from '../../../app/(main)/bank-integration/bank-integration.selector';
import { EXTERNAL_SOURCE } from '../../../rule/constant/external-source.constant';
import { useBankIntegration } from '../../context/bank-integration.context';

export const BankIntegrationEmptyAccounts = () => {
    const { t } = useLingui();
    const { integration, capabilities } = useBankIntegration();
    const bank = t(EXTERNAL_SOURCE[integration.provider]);
    const description = capabilities.supportsFileImport
        ? t`No accounts yet. Import a statement from ${bank} to add them.`
        : t`No accounts yet. Accounts you sync appear here.`;

    return (
        <Text testID={BankIntegrationSelector.EmptyState} className="text-secondary-foreground px-3xl pt-md text-[13px] leading-[18px]">
            {description}
        </Text>
    );
};
