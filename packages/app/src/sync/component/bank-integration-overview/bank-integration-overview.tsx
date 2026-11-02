import { View } from 'react-native';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { BankIntegrationSelector } from '../../../app/(main)/bank-integration/bank-integration.selector';
import { useBankIntegration } from '../../context/bank-integration.context';
import { useBankIntegrationSyncsQuery } from '../../query/use-bank-integration-syncs.query';
import { BankIntegrationStatusPill } from '../bank-integration-status-pill/bank-integration-status-pill';

export const BankIntegrationOverview = () => {
    const { integration } = useBankIntegration();
    const syncs = useBankIntegrationSyncsQuery(integration.id);

    return (
        <View className="items-center gap-y-[8px] py-xl" testID={BankIntegrationSelector.Overview}>
            <BankLogo bankProvider={integration.provider} size={56} />
            <BankIntegrationStatusPill syncs={syncs} />
        </View>
    );
};
