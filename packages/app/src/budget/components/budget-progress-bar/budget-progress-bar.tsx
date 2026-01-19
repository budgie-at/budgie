import { VariantProps, cva } from 'class-variance-authority';
import { View, ViewStyle } from 'react-native';

import { BudgetStatusEnum } from '../../enum/budget-status.enum';

const trackVariants = cva('bg-secondary-corner rounded-full', {
    variants: {
        size: {
            sm: 'h-2',
            md: 'h-3'
        }
    },
    defaultVariants: {
        size: 'md'
    }
});

const fillVariants = cva('rounded-full', {
    variants: {
        size: {
            sm: 'h-2',
            md: 'h-3'
        },
        status: {
            [BudgetStatusEnum.ON_TRACK]: 'bg-positive-foreground',
            [BudgetStatusEnum.WARNING]: 'bg-warning-foreground',
            [BudgetStatusEnum.OVER]: 'bg-destructive-foreground'
        }
    },
    defaultVariants: {
        size: 'md',
        status: BudgetStatusEnum.ON_TRACK
    }
});

interface Props extends VariantProps<typeof trackVariants> {
    readonly percentage: number;
    readonly status: BudgetStatusEnum;
}

export const BudgetProgressBar = ({ percentage, status, size }: Props) => {
    const clampedPercentage = Math.min(percentage, 100);
    const fillStyle: ViewStyle = { width: `${clampedPercentage}%` };

    return (
        <View className={trackVariants({ size })}>
            <View style={fillStyle} className={fillVariants({ size, status })} />
        </View>
    );
};
