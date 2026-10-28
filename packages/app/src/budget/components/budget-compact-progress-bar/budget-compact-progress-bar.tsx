import { Text, View } from 'react-native';

import { useBudgetProgressLabels } from '../../hooks/use-budget-progress-labels.hook';
import { BudgetProgressTrack } from '../budget-progress-track/budget-progress-track';

interface Props {
    readonly currencySymbol: string;
    readonly spent: number;
    readonly limit: number;
    readonly spentTestID: string;
    readonly remainingTestID: string;
}

export const BudgetCompactProgressBar = ({ currencySymbol, spent, limit, spentTestID, remainingTestID }: Props) => {
    const { amountLabel, percentLabel, remainingLabel, remainingAmountLabel } = useBudgetProgressLabels(spent, limit, currencySymbol, 0);

    return (
        <View className="gap-y-md">
            <BudgetProgressTrack spent={spent} limit={limit} />

            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-x-sm">
                    <Text className="text-primary text-md font-medium" testID={spentTestID} accessible accessibilityLabel={amountLabel}>
                        {amountLabel}
                    </Text>
                    <Text className="text-secondary-foreground text-sm">{percentLabel}</Text>
                </View>

                <View className="flex-row items-center gap-x-xs">
                    <Text className="text-secondary-foreground text-sm">{remainingLabel}</Text>
                    <Text testID={remainingTestID} className="text-primary text-md font-medium">
                        {remainingAmountLabel}
                    </Text>
                </View>
            </View>
        </View>
    );
};
