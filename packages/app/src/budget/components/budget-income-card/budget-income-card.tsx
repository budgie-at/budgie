import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { BudgetIncomeStatusInterface } from '../../interface/budget-calculation-result.interface';

interface Props {
    readonly incomeStatuses: readonly BudgetIncomeStatusInterface[];
    readonly totalActual: number;
    readonly totalExpected: number;
}

export const BudgetIncomeCard = ({ incomeStatuses, totalActual, totalExpected }: Props) => {
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatMoney = useFormatDigits(decimalPlaces);
    const { symbol } = defaultInstrument;

    return (
        <Card>
            <Text className="text-primary font-medium mb-md">
                <Trans>Income</Trans>
            </Text>
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
