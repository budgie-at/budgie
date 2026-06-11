import { AccountDebtTypeEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View, ViewStyle } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { ProtectedMoney } from '../../../@generic/component/protected-money/protected-money';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';

interface Props {
    readonly balance: number;
    readonly debtType: AccountDebtTypeEnum;
    readonly targetAmount: number;
    readonly instrumentSymbol: string;
}

export const DebtAccountBalance = ({ balance, debtType, instrumentSymbol, targetAmount }: Props) => {
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);

    const outstandingBalance = debtType === AccountDebtTypeEnum.BORROW ? -balance : balance;
    const currentBalance = Math.max(outstandingBalance, 0);
    const paidAmount = Math.max(targetAmount - currentBalance, 0);
    const percentage = isPositiveNumber(targetAmount) ? Math.min(Number(((paidAmount / targetAmount) * 100).toFixed(2)), 100) : 0;
    const barStyle: ViewStyle = { width: `${percentage}%` };

    const formattedPaidAmount = formatDigits(paidAmount, instrumentSymbol);
    const formattedAmountToReturn = formatDigits(targetAmount, instrumentSymbol);

    return (
        <View className="p-5xl border border-warning-corner bg-warning-background gap-y-md rounded-3xl">
            <Text className="font-medium text-xs uppercase text-secondary-foreground text-center">
                <Trans>Current Balance</Trans>
            </Text>

            <ProtectedMoney className="justify-start" minFontSize={10} maxFontSize={36} instrumentSymbol={instrumentSymbol}>
                {currentBalance}
            </ProtectedMoney>

            <View className="my-3xl h-px bg-secondary-corner" />

            <View className="gap-y-xl">
                <View className="flex-row items-center justify-between">
                    <Text className="text-secondary-foreground text-sm uppercase font-medium">
                        <Trans>Payment Progress</Trans>
                    </Text>

                    <Text className="text-warning-foreground text-sm font-semibold">{percentage}%</Text>
                </View>

                <View className="rounded-5xl bg-secondary-background overflow-hidden">
                    <View className="rounded-5xl bg-dark-warning-foreground min-w-0.5 h-2" style={barStyle} />
                </View>

                <View className="flex-row items-center justify-between">
                    <Text className="text-secondary-foreground text-sm">
                        <Trans>Paid: {formattedPaidAmount}</Trans>
                    </Text>
                    <Text className="text-secondary-foreground text-sm">
                        <Trans>Total: {formattedAmountToReturn}</Trans>
                    </Text>
                </View>
            </View>
        </View>
    );
};
