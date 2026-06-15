import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { cn } from '../../../@generic/utils/cn.util';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';
import { TransactionInfoSimilarBar } from '../transaction-info-similar-bar/transaction-info-similar-bar';

import type { SimilarTransactionStatsInterface } from '@budgie/contracts';

const BAR_MAX_HEIGHT = 92;

interface Props {
    readonly stats: SimilarTransactionStatsInterface | null;
    readonly title: string;
    readonly isLoading: boolean;
}

const getMonthLabelDate = (monthKey: string): Date => {
    const [year = '0', month = '1'] = monthKey.split('-');

    return new Date(Number(year), Number(month) - 1, 1);
};

export const TransactionInfoSimilarCard = ({ stats, title, isLoading }: Props) => {
    const { t } = useLingui();
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);

    const hasStats = isDefined(stats) && stats.count > 1;
    const opacityClassName = isLoading ? 'opacity-60' : 'opacity-100';

    if (!hasStats) {
        return null;
    }

    const maxAmount = Math.max(...stats.months.map(month => month.totalAmount), 1);
    const total = formatDigits(convertFromMicroUnits(stats.totalAmount), stats.currencySymbol);
    const average = formatDigits(convertFromMicroUnits(stats.averageAmount), stats.currencySymbol);
    const similarCount = stats.count;
    const description = t({
        message: plural(similarCount, {
            one: '# similar transaction',
            other: '# similar transactions'
        })
    });

    return (
        <Card
            size="md"
            variant="ghost"
            className={cn('border-0 gap-y-xl', opacityClassName)}
            testID={TransactionInfoPageSelector.SimilarCard}
        >
            <View className="items-center gap-y-xs">
                <Text className="text-md text-primary font-semibold text-center" numberOfLines={1}>
                    {title}
                </Text>
                <Text className="text-sm text-secondary-foreground text-center">{description}</Text>
            </View>

            <View className="flex-row items-center justify-center gap-x-4xl">
                <View className="w-[116px] items-center gap-y-xxs" collapsable={false} testID={TransactionInfoPageSelector.SimilarTotal}>
                    <Text className="text-xs text-secondary-foreground text-center">{t`Total`}</Text>
                    <Text className="text-lg text-primary font-semibold text-center tabular-nums">{total}</Text>
                </View>
                <View className="h-10 w-px bg-secondary-corner" />
                <View className="w-[116px] items-center gap-y-xxs" collapsable={false} testID={TransactionInfoPageSelector.SimilarAverage}>
                    <Text className="text-xs text-secondary-foreground text-center">{t`Average`}</Text>
                    <Text className="text-lg text-primary font-semibold text-center tabular-nums">{average}</Text>
                </View>
            </View>

            <View className="flex-row items-end gap-x-sm h-[132px]">
                {stats.months.map((month, index) => {
                    const height = isPositiveNumber(month.totalAmount)
                        ? Math.max(8, Math.round((month.totalAmount / maxAmount) * BAR_MAX_HEIGHT))
                        : 0;
                    const label = format(getMonthLabelDate(month.monthKey), 'MMM yy', { locale: enUS });
                    const value = isPositiveNumber(month.totalAmount)
                        ? formatDigits(convertFromMicroUnits(month.totalAmount), stats.currencySymbol)
                        : null;

                    return (
                        <TransactionInfoSimilarBar
                            key={month.monthKey}
                            height={height}
                            label={label}
                            value={value}
                            testID={TransactionInfoPageSelector.SimilarBar(index)}
                        />
                    );
                })}
            </View>
        </Card>
    );
};
