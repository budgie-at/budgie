import { VariantProps, cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { BudgetAmountAlignType } from './budget-amount-align.type';
import { BudgetAmountSizeType } from './budget-amount-size.type';
import { BudgetAmountStatusType } from './budget-amount-status.type';

const amountVariants = cva('font-bold', {
    variants: {
        status: {
            positive: 'text-positive-foreground',
            negative: 'text-warning-foreground'
        },
        size: {
            sm: 'text-lg font-semibold',
            lg: 'text-3xl font-bold'
        }
    },
    defaultVariants: { size: 'lg', status: 'positive' }
});

const containerVariants = cva('', {
    variants: {
        align: {
            start: '',
            end: 'items-end'
        }
    },
    defaultVariants: { align: 'start' }
});

interface Props extends VariantProps<typeof amountVariants>, VariantProps<typeof containerVariants> {
    readonly label: string;
    readonly amount: string;
    readonly subtitle: string;
    readonly status?: BudgetAmountStatusType;
    readonly size?: BudgetAmountSizeType;
    readonly align?: BudgetAmountAlignType;
}

export const BudgetAmountDisplay = ({ label, amount, subtitle, status = 'positive', size = 'lg', align = 'start' }: Props) => (
    <View className={containerVariants({ align })}>
        <Text className="text-xs text-secondary-foreground">{label}</Text>
        <Text className={amountVariants({ status, size })}>{amount}</Text>

        <Text className="text-xs text-secondary-foreground">{subtitle}</Text>
    </View>
);
