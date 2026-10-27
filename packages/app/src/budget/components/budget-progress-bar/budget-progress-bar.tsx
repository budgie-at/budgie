import { useAtomValue } from '@effect/atom-react/Hooks';
import { Text, View } from 'react-native';

import { decimalPlacesAtom } from '../../../settings/constants/settings-atoms.constant';
import { useBudgetProgressLabels } from '../../hooks/use-budget-progress-labels.hook';
import { BudgetProgressTrack } from '../budget-progress-track/budget-progress-track';

interface Props {
    readonly currencySymbol: string;
    readonly spent: number;
    readonly limit: number;
    readonly spentTestID: string;
    readonly remainingTestID: string;
}

export const BudgetProgressBar = ({ currencySymbol, spent, limit, spentTestID, remainingTestID }: Props) => {
    const decimalPlaces = useAtomValue(decimalPlacesAtom);
    const { amountLabel, percentLabel, remainingLabel, remainingAmountLabel } = useBudgetProgressLabels(
        spent,
        limit,
        currencySymbol,
        decimalPlaces
    );

    return (
        <View className="gap-y-md">
            <View className="flex-row items-center justify-between">
                <Text className="text-primary text-md font-semibold" testID={spentTestID} accessible accessibilityLabel={amountLabel}>
                    {amountLabel}
                </Text>
                <Text className="text-secondary-foreground text-sm">{percentLabel}</Text>
            </View>

            <BudgetProgressTrack spent={spent} limit={limit} />

            <View className="flex-row items-center justify-between">
                <Text className="text-secondary-foreground text-sm">{remainingLabel}</Text>
                <Text testID={remainingTestID} className="text-primary text-md font-semibold">
                    {remainingAmountLabel}
                </Text>
            </View>
        </View>
    );
};
