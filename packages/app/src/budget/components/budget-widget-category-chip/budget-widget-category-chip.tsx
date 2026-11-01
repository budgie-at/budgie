import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { BudgetBarTone, resolveBudgetBarTone } from '../../utils/resolve-budget-bar-tone.util';

const PERCENT_MULTIPLIER = 100;
const MINIMUM_OVERFLOW_SHARE = 0.06;

const percentTextVariants = cva<{ tone: Record<BudgetBarTone, string> }>('w-10 text-right text-xs font-semibold tabular-nums', {
    variants: {
        tone: {
            green: 'text-secondary-foreground',
            yellow: 'text-warning-ink',
            red: 'text-destructive-ink'
        }
    }
});

const fillVariants = cva<{ tone: Record<BudgetBarTone, string> }>('h-full', {
    variants: {
        tone: {
            green: 'bg-positive-gauge',
            yellow: 'bg-warning-fill',
            red: 'bg-destructive-fill'
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
    const isAmountProtected = useIsAmountProtected();

    const ratio = isPositiveNumber(limitAmount) ? spent / limitAmount : 0;
    const percentLabel = `${Math.round(ratio * PERCENT_MULTIPLIER)}%`;
    const title = category?.title ?? '';
    const tone = resolveBudgetBarTone(ratio);
    const isOverLimit = ratio > 1;
    const withinLimitStyle = isOverLimit ? { flexGrow: 1 / ratio } : { width: `${ratio * PERCENT_MULTIPLIER}%` as const };
    const overflowStyle = { flexGrow: Math.max(1 - 1 / ratio, MINIMUM_OVERFLOW_SHARE) };
    const isFillVisible = !isAmountProtected;
    const withinLimitClassName = isOverLimit ? 'h-full bg-[#F4C2BE] dark:bg-destructive-fill/35' : fillVariants({ tone });
    const trackClassName = isOverLimit ? 'gap-x-[3px]' : 'bg-secondary-corner';

    return (
        <View testID={testID} collapsable={false} className="flex-row items-center gap-x-md">
            <Text className="w-[42%] shrink-0 text-primary text-sm" numberOfLines={1}>
                {title}
            </Text>
            <View className={cn('h-[5px] flex-1 flex-row overflow-hidden rounded-full', trackClassName)}>
                {isFillVisible ? <View className={withinLimitClassName} style={withinLimitStyle} /> : null}
                {isFillVisible && isOverLimit ? <View className="h-full bg-destructive-fill" style={overflowStyle} /> : null}
            </View>
            <ProtectedText testID={spentTestID} className={percentTextVariants({ tone })}>
                {percentLabel}
            </ProtectedText>
        </View>
    );
};
