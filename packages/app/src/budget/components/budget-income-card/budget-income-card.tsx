import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { BudgetIncomeStatusInterface } from '../../interface/budget-calculation-result.interface';

interface Props {
    readonly incomeStatuses: readonly BudgetIncomeStatusInterface[];
    readonly totalActual: number;
    readonly totalExpected: number;
}

export const BudgetIncomeCard = ({ incomeStatuses, totalActual, totalExpected }: Props) => {
    const router = useRouter();
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatMoney = useFormatDigits(decimalPlaces);
    const { symbol } = defaultInstrument;

    const handleAddIncome = () => void router.push('/budget/income-expectations');

    return (
        <Card>
            <View className="flex-row items-center justify-between mb-md">
                <Text className="text-primary font-medium">
                    <Trans>Income</Trans>
                </Text>
                <HapticPressable onPress={handleAddIncome} className="p-sm">
                    <Icon icon={UserIconNameEnum.Plus} size={20} className="text-secondary-foreground" />
                </HapticPressable>
            </View>
            {incomeStatuses.map(income => (
                <View key={income.categoryId} className="flex-row justify-between py-sm">
                    <Text className="text-primary">{income.categoryName}</Text>
                    <Text className="text-secondary-foreground">
                        {formatMoney(income.actual, symbol)} / {formatMoney(income.expected, symbol)}
                    </Text>
                </View>
            ))}
            <View className="flex-row justify-between pt-md mt-md border-t border-secondary-corner">
                <Text className="text-primary font-medium">
                    <Trans>Total</Trans>
                </Text>
                <Text className="text-primary font-medium">
                    {formatMoney(totalActual, symbol)} / {formatMoney(totalExpected, symbol)}
                </Text>
            </View>
        </Card>
    );
};
