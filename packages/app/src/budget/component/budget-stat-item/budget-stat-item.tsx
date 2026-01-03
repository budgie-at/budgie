import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { BudgetStatStatusType } from './budget-stat-status.type';

const valueVariants = cva('text-lg font-bold', {
    variants: {
        status: {
            warning: 'text-warning-foreground',
            positive: 'text-positive-foreground',
            neutral: 'text-primary'
        }
    }
});

interface Props {
    readonly value: number;
    readonly label: string;
    readonly status: BudgetStatStatusType;
}

export const BudgetStatItem = ({ value, label, status }: Props) => (
    <View className="flex-1 items-center">
        <Text className={valueVariants({ status })}>{value}</Text>
        <Text className="text-xs text-secondary-foreground">{label}</Text>
    </View>
);

