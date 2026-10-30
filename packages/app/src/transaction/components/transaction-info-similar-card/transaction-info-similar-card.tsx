import { convertFromMicroUnits } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { THOUSAND } from '../../../i18n/constant/compact-thresholds.constant';
import { useFormatCompactDigits } from '../../../i18n/hook/use-format-compact-digits.hook';
import { TRANSACTION_INFO_STACKED_FONT_SCALE } from '../../constant/transaction-info-stacked-font-scale.constant';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';
import { TransactionInfoSimilarMetric } from '../transaction-info-similar-metric/transaction-info-similar-metric';
import { TransactionInfoSimilarMonthBar } from '../transaction-info-similar-month-bar/transaction-info-similar-month-bar';

import type { SimilarTransactionStatsInterface } from '@budgie/contracts';

interface Props {
    readonly stats: SimilarTransactionStatsInterface | null;
    readonly title: string;
    readonly isLoading: boolean;
}

const chartContainerStyle = { flexGrow: 1 };
const continuousCorners = { borderCurve: 'continuous' as const };

const summaryVariants = cva('gap-x-5xl gap-y-xl', {
    variants: {
        largeText: {
            true: 'flex-col',
            false: 'flex-row flex-wrap'
        }
    }
});

export const TransactionInfoSimilarCard = ({ stats, title, isLoading }: Props) => {
    const { t } = useLingui();
    const { fontScale } = useWindowDimensions();
    const formatDigits = useProtectedAmountLabel();
    const formatCompactDigits = useFormatCompactDigits(THOUSAND);

    const hasStats = isDefined(stats) && stats.count > 1;
    const opacityClassName = isLoading ? 'opacity-60' : 'opacity-100';

    if (!hasStats) {
        return null;
    }

    const maxAmount = Math.max(...stats.months.map(month => month.totalAmount), 1);
    const total = formatDigits(convertFromMicroUnits(stats.totalAmount), stats.currencySymbol);
    const average = formatDigits(convertFromMicroUnits(stats.averageAmount), stats.currencySymbol);
    const currentMonthKey = stats.months.at(-1)?.monthKey ?? null;
    const similarCount = stats.count;
    const description = t({
        message: plural(similarCount, {
            one: '# similar · last 6 months',
            other: '# similar · last 6 months'
        })
    });

    return (
        <View
            className={cn('gap-y-3xl rounded-3xl bg-transaction-detail-row p-3xl', opacityClassName)}
            style={continuousCorners}
            collapsable={false}
            testID={TransactionInfoPageSelector.SimilarCard}
        >
            <View className="gap-y-xxs">
                <Text className="text-[17px] leading-[22px] text-primary font-semibold">{title}</Text>
                <Text className="text-[13px] leading-[18px] text-secondary-foreground">{description}</Text>
            </View>

            <View className={summaryVariants({ largeText: fontScale > TRANSACTION_INFO_STACKED_FONT_SCALE })}>
                <TransactionInfoSimilarMetric label={t`Total`} amount={total} testID={TransactionInfoPageSelector.SimilarTotal} />
                <TransactionInfoSimilarMetric label={t`Average`} amount={average} testID={TransactionInfoPageSelector.SimilarAverage} />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="grow-0" contentContainerStyle={chartContainerStyle}>
                <View className="grow flex-row items-end gap-x-sm min-h-[126px]">
                    {stats.months.map((month, index) => (
                        <TransactionInfoSimilarMonthBar
                            key={month.monthKey}
                            month={month}
                            maxAmount={maxAmount}
                            currencySymbol={stats.currencySymbol}
                            currentMonthKey={currentMonthKey}
                            formatCompactDigits={formatCompactDigits}
                            formatDigits={formatDigits}
                            testID={TransactionInfoPageSelector.SimilarBar(index)}
                        />
                    ))}
                </View>
            </ScrollView>
        </View>
    );
};
