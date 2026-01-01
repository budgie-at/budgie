import { View } from 'react-native';

import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    readonly planned: number;
    readonly actual: number;
    readonly className?: string;
}

export const BudgetProgressBar = ({ planned, actual, className }: Props) => {
    const percentage = planned > 0 ? Math.min((actual / planned) * 100, 100) : 0;
    const isOverBudget = actual > planned;
    const isWarning = percentage >= 80 && percentage < 100;

    const getProgressColor = () => {
        if (isOverBudget) {
            return 'bg-red-500';
        }

        if (isWarning) {
            return 'bg-yellow-500';
        }

        return 'bg-green-500';
    };

    return (
        <View className={cn('h-2 w-full rounded-full bg-muted', className)}>
            <View className={cn('h-full rounded-full', getProgressColor())} style={{ width: `${percentage}%` }} />
        </View>
    );
};
