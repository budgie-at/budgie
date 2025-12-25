import { CurrencyEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View, ViewStyle } from 'react-native';

import { FormattedMoney } from '../../../@generic/component/formatted-money/formatted-money';
import { useFormatMoney } from '../../../i18n/hook/use-format-money.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';

interface Props {
    readonly balance: number;
    readonly targetAmount: number;
    readonly currency: CurrencyEnum;
}

export const DebtAccountBalance = ({ balance, currency, targetAmount }: Props) => {
    const { decimalPlaces, defaultCurrency } = useSettingsContext();
    const format = useFormatMoney(decimalPlaces, defaultCurrency);

    const percentage = Number((targetAmount > 0 ? (balance / targetAmount) * 100 : 0).toFixed(2));
    const barStyle: ViewStyle = { width: `${percentage}%` };

    const formattedBalance = format(balance);
    const formattedAmountToReturn = format(targetAmount);

    return (
        <View className="p-5xl border border-warning-corner bg-warning-background gap-y-md rounded-3xl">
            <Text className="font-medium text-xs uppercase text-secondary-foreground text-center">
                <Trans>Current Balance</Trans>
            </Text>

            <FormattedMoney className="justify-start" minFontSize={10} maxFontSize={36} decimalPlaces={decimalPlaces} currency={currency}>
                {balance}
            </FormattedMoney>

            <View className="my-3xl h-[1px] bg-secondary-corner" />

            <View className="gap-y-xl">
                <View className="flex-row items-center justify-between">
                    <Text className="text-secondary-foreground text-sm uppercase font-medium">
                        <Trans>Payment Progress</Trans>
                    </Text>

                    <Text className="text-warning-foreground text-sm font-semibold">{percentage}%</Text>
                </View>

                <View className="rounded-5xl bg-secondary-background overflow-hidden">
                    <View className="rounded-5xl bg-dark-warning-foreground min-w-[2px] h-[8px]" style={barStyle} />
                </View>

                <View className="flex-row items-center justify-between">
                    <Text className="text-secondary-foreground text-sm">
                        <Trans>Paid: {formattedBalance}</Trans>
                    </Text>
                    <Text className="text-secondary-foreground text-sm">
                        <Trans>Total: {formattedAmountToReturn}</Trans>
                    </Text>
                </View>
            </View>
        </View>
    );
};
