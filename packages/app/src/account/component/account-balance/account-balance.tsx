import { CurrencyEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { FormattedMoney } from '../../../@generic/components/formatted-money/formatted-money';
import { ScreenshotProtectedView } from '../../../@generic/components/screenshot-protected-view/screenshot-protected-view';
import { useSettingsContext } from '../../../settings/context/settings.context';

interface Props {
    readonly balance: number;
    readonly currency: CurrencyEnum;
}

export const AccountBalance = ({ balance, currency }: Props) => {
    const { decimalPlaces } = useSettingsContext();

    return (
        <View className="p-5xl border border-default-corner bg-default-background gap-y-md rounded-3xl">
            <Text className="font-medium text-xs uppercase text-secondary-foreground">
                <Trans>Current Balance</Trans>
            </Text>

            <ScreenshotProtectedView>
                <FormattedMoney className="justify-start" minFontSize={10} maxFontSize={36} decimalPlaces={decimalPlaces} currency={currency}>
                    {balance}
                </FormattedMoney>
            </ScreenshotProtectedView>
        </View>
    );
};
