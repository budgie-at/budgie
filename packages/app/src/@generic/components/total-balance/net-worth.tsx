import { convertFromMicroUnits } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { useNetWorthQuery } from '../../../account/query/use-net-worth.query';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { FormattedMoney } from '../formatted-money/formatted-money';

export const NetWorth = () => {
    const { defaultCurrency, decimalPlaces } = useSettingsContext();
    const netWorth = useNetWorthQuery();

    return (
        <View className="items-center gap-y-md mb-5xl">
            <Text className="uppercase text-xs text-secondary-foreground">
                <Trans>Total Balance</Trans>
            </Text>

            <FormattedMoney decimalPlaces={decimalPlaces} minFontSize={24} maxFontSize={60} currency={defaultCurrency}>
                {convertFromMicroUnits(netWorth)}
            </FormattedMoney>
        </View>
    );
};
