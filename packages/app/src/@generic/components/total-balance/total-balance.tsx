import { PRECISION } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { useSettingsContext } from '../../../settings/context/settings.context';
import { FormattedMoney } from '../formatted-money/formatted-money';

const MOCK_BALANCE = (1_123_213.12)

export const TotalBalance = () => {
    const { defaultCurrency, decimalPlaces } = useSettingsContext();

    return (
        <View className="items-center gap-y-md mb-5xl">
            <Text className="uppercase text-xs text-secondary-foreground">
                <Trans>Total Balance</Trans>
            </Text>

            <FormattedMoney decimalPlaces={decimalPlaces} fontSize={60} minFontSize={24} maxFontSize={60} currency={defaultCurrency}>
                {MOCK_BALANCE * PRECISION}
            </FormattedMoney>
        </View>
    );
};
