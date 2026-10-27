import { useAtomValue } from '@effect/atom-react/Hooks';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { ProtectedMoney } from '../../../@generic/component/protected-money/protected-money';
import { useHomePageDataQuery } from '../../../account/query/use-home-page-data.query';
import { BankIntegrationSelector } from '../../../app/(main)/bank-integration/bank-integration.selector';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useBankIntegration } from '../../context/bank-integration.context';
import { BankIntegrationStatusPill } from '../bank-integration-status-pill/bank-integration-status-pill';

export const BankIntegrationOverview = () => {
    const { integration, capabilities } = useBankIntegration();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const { accounts, balanceSummary } = useHomePageDataQuery();

    const total = balanceSummary.bankProviderTotals.get(integration.id) ?? 0;
    const syncs = accounts
        .filter(account => account.integrationId === integration.id)
        .map(account => account.sync)
        .filter(isDefined);
    const statusPill = capabilities.supportsLiveSync ? <BankIntegrationStatusPill syncs={syncs} /> : null;

    return (
        <View className="items-center gap-y-xl py-4xl" testID={BankIntegrationSelector.Overview}>
            <BankLogo bankProvider={integration.provider} size={56} />
            <ProtectedMoney
                fontSize={32}
                minFontSize={32}
                maxFontSize={32}
                className="font-semibold"
                instrumentSymbol={defaultInstrument.symbol}
            >
                {total}
            </ProtectedMoney>
            {statusPill}
        </View>
    );
};
