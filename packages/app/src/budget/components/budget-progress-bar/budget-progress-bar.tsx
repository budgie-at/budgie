import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { BudgetBarTone, resolveBudgetBarTone } from '../../utils/resolve-budget-bar-tone.util';

const MIN_PROGRESS = 0;
const MAX_PROGRESS = 1;
const PERCENT_MULTIPLIER = 100;

interface Props {
    readonly spent: number;
    readonly limit: number;
    readonly testID?: string;
    readonly spentTestID?: string;
}

const barVariants = cva<{ tone: Record<BudgetBarTone, string> }>('h-full rounded-full', {
    variants: {
        tone: {
            green: 'bg-positive-foreground',
            yellow: 'bg-warning-foreground',
            red: 'bg-destructive-foreground'
        }
    }
});

export const BudgetProgressBar = ({ spent, limit, testID, spentTestID }: Props) => {
    const ratio = isPositiveNumber(limit) ? spent / limit : 0;
    const clampedRatio = Math.max(MIN_PROGRESS, Math.min(MAX_PROGRESS, ratio));
    const percent = Math.round(ratio * PERCENT_MULTIPLIER);
    const displaySpent = convertFromMicroUnits(spent);
    const displayLimit = convertFromMicroUnits(limit);
    const widthPercent: `${number}%` = `${clampedRatio * PERCENT_MULTIPLIER}%`;
    const widthStyle = { width: widthPercent };
    const percentLabel = `${percent}%`;
    const amountLabel = `${displaySpent.toFixed(2)} / ${displayLimit.toFixed(2)}`;

    return (
        <View testID={testID} className="gap-y-md">
            <View className="flex-row items-center justify-between">
                <Text className="text-primary font-semibold text-md" testID={spentTestID}>
                    {amountLabel}
                </Text>

                <Text className="text-secondary-foreground text-sm">{percentLabel}</Text>
            </View>

            <View className="h-3 bg-secondary-corner rounded-full overflow-hidden">
                <View className={barVariants({ tone: resolveBudgetBarTone(ratio) })} style={widthStyle} />
            </View>
        </View>
    );
};
