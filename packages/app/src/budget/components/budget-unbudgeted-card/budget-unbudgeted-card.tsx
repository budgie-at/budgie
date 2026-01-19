import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { BudgetUnbudgetedCategorySpendingInterface } from '../../interface/budget-category-status.interface';

interface Props {
    readonly unbudgetedSpending: readonly BudgetUnbudgetedCategorySpendingInterface[];
    readonly totalUnbudgetedSpent: number;
}

export const BudgetUnbudgetedCard = ({ unbudgetedSpending, totalUnbudgetedSpent }: Props) => {
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatMoney = useFormatDigits(decimalPlaces);
    const { symbol } = defaultInstrument;

    return (
        <Card>
            <Text className="text-primary font-medium mb-md">
                <Trans>Unbudgeted Spending</Trans>
            </Text>
            {unbudgetedSpending.map(spending => (
                <View key={spending.category.id} className="flex-row justify-between py-sm">
                    <Text className="text-primary">{spending.category.title}</Text>
                    <Text className="text-secondary-foreground">{formatMoney(spending.spent, symbol)}</Text>
                </View>
            ))}
            <View className="flex-row justify-between pt-md mt-md border-t border-secondary-corner">
                <Text className="text-primary font-medium">
                    <Trans>Total</Trans>
                </Text>
                <Text className="text-primary font-medium">{formatMoney(totalUnbudgetedSpent, symbol)}</Text>
            </View>
        </Card>
    );
};
