import { cva } from 'class-variance-authority';
import { View } from 'react-native';

import { buildBudgetProgressBarMetrics } from '../../utils/build-budget-progress-bar-metrics.util';
import { BudgetBarTone, resolveBudgetBarTone } from '../../utils/resolve-budget-bar-tone.util';

interface Props {
    readonly spent: number;
    readonly limit: number;
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

export const BudgetProgressTrack = ({ spent, limit }: Props) => {
    const metrics = buildBudgetProgressBarMetrics(spent, limit);

    return (
        <View className="h-3 bg-secondary-corner rounded-full overflow-hidden">
            <View className={barVariants({ tone: resolveBudgetBarTone(metrics.ratio) })} style={metrics.widthStyle} />
        </View>
    );
};
