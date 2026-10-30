import { convertFromMicroUnits } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { cn } from '../../../@generic/utils/cn.util';
import { THOUSAND } from '../../../i18n/constant/compact-thresholds.constant';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useFormatCompactDigits } from '../../../i18n/hook/use-format-compact-digits.hook';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';
import { TransactionInfoSimilarMonthBar } from '../transaction-info-similar-month-bar/transaction-info-similar-month-bar';

import type { SimilarTransactionStatsInterface } from '@budgie/contracts';

interface Props {
    readonly stats: SimilarTransactionStatsInterface | null;
    readonly title: string;
    readonly isLoading: boolean;
}

const continuousCorners = { borderCurve: 'continuous' as const };

export const TransactionInfoSimilarCard = ({ stats, title, isLoading }: Props) => {
    const { t } = useLingui();
    const formatDigits = useDisplayFormatDigits();
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
            className={cn('gap-y-3xl rounded-3xl bg-surface-row p-3xl', opacityClassName)}
            style={continuousCorners}
            collapsable={false}
            testID={TransactionInfoPageSelector.SimilarCard}
        >
            <View className="gap-y-xxs">
                <Text className="text-[17px] leading-[22px] text-primary font-semibold" numberOfLines={1}>
                    {title}
                </Text>
                <Text className="text-[13px] leading-[18px] text-secondary-foreground">{description}</Text>
            </View>

            <View className="flex-row gap-x-7xl">
                <View className="gap-y-xxs" collapsable={false} testID={TransactionInfoPageSelector.SimilarTotal}>
                    <Text className="text-[13px] leading-[18px] text-secondary-foreground">
                        <Trans>Total</Trans>
                    </Text>
                    <Text className="text-[20px] leading-[25px] text-primary font-semibold tabular-nums">{total}</Text>
                </View>
                <View className="gap-y-xxs" collapsable={false} testID={TransactionInfoPageSelector.SimilarAverage}>
                    <Text className="text-[13px] leading-[18px] text-secondary-foreground">
                        <Trans>Average</Trans>
                    </Text>
                    <Text className="text-[20px] leading-[25px] text-primary font-semibold tabular-nums">{average}</Text>
                </View>
            </View>

            <View className="flex-row items-end gap-x-sm h-[126px]">
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
        </View>
    );
};
