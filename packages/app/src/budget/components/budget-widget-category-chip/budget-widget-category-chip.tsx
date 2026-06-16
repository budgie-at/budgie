import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { BudgetBarTone, resolveBudgetBarTone } from '../../utils/resolve-budget-bar-tone.util';

const PERCENT_MULTIPLIER = 100;

const percentTextVariants = cva<{ tone: Record<BudgetBarTone, string> }>('text-sm font-medium', {
    variants: {
        tone: {
            green: 'text-primary',
            yellow: 'text-warning-foreground',
            red: 'text-destructive-foreground'
        }
    }
});

interface Props {
    readonly categoryId: number;
    readonly limitAmount: number;
    readonly spent: number;
    readonly testID?: string;
    readonly spentTestID?: string;
}

export const BudgetWidgetCategoryChip = ({ categoryId, limitAmount, spent, testID, spentTestID }: Props) => {
    const { category } = useGetCategoryByIdQuery(categoryId);

    const ratio = isPositiveNumber(limitAmount) ? spent / limitAmount : 0;
    const percentLabel = `${Math.round(ratio * PERCENT_MULTIPLIER)}%`;
    const title = category?.title ?? '';

    return (
        <View testID={testID} collapsable={false} className="flex-row items-center gap-x-xs">
            <Text className="text-secondary-foreground text-sm">{title}</Text>
            <Text testID={spentTestID} className={percentTextVariants({ tone: resolveBudgetBarTone(ratio) })}>
                {percentLabel}
            </Text>
        </View>
    );
};
