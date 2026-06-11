import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { cn } from '../../../@generic/utils/cn.util';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { TransactionInfoSimilarPeriodEnum } from '../../enum/transaction-info-similar-period.enum';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';
import { TransactionInfoSimilarBar } from '../transaction-info-similar-bar/transaction-info-similar-bar';
import { TransactionInfoSimilarPeriodButton } from '../transaction-info-similar-period-button/transaction-info-similar-period-button';

import type { TransactionInfoSimilarCardPropsInterface } from '../../interface/transaction-info-similar-card-props.interface';

const BAR_MAX_HEIGHT = 92;

export const TransactionInfoSimilarCard = ({
    stats,
    period,
    title,
    isLoading,
    onPeriodChange
}: TransactionInfoSimilarCardPropsInterface) => {
    const { t } = useLingui();
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);

    const hasStats = isDefined(stats) && isPositiveNumber(stats.count);
    const maxAmount = hasStats ? Math.max(...stats.months.map(month => month.totalAmount), 1) : 1;
    const total = hasStats ? formatDigits(convertFromMicroUnits(stats.totalAmount), stats.currencySymbol) : null;
    const average = hasStats ? formatDigits(convertFromMicroUnits(stats.averageAmount), stats.currencySymbol) : null;
    const similarCount = hasStats ? stats.count : 0;
    const opacityClassName = isLoading ? 'opacity-60' : 'opacity-100';
    const description = hasStats ? t`${similarCount} similar transactions` : t`No similar transactions`;
    const periodLabels: Record<TransactionInfoSimilarPeriodEnum, string> = {
        [TransactionInfoSimilarPeriodEnum.SIX_MONTHS]: t`6 months`,
        [TransactionInfoSimilarPeriodEnum.TWELVE_MONTHS]: t`12 months`
    };

    return (
        <Card size="md" className={cn('gap-y-xl', opacityClassName)} testID={TransactionInfoPageSelector.SimilarCard}>
            <View className="flex-row items-center gap-x-xl">
                <View className="flex-1">
                    <Text className="text-md text-primary font-semibold">{title}</Text>
                    <Text className="text-sm text-secondary-foreground">{description}</Text>
                </View>

                <View className="flex-row rounded-full border border-secondary-corner bg-secondary-background p-xxs">
                    {Object.values(TransactionInfoSimilarPeriodEnum).map(periodOption => (
                        <TransactionInfoSimilarPeriodButton
                            key={periodOption}
                            label={periodLabels[periodOption]}
                            period={periodOption}
                            selectedPeriod={period}
                            onPeriodChange={onPeriodChange}
                        />
                    ))}
                </View>
            </View>

            {hasStats ? (
                <View className="flex-row gap-x-lg">
                    <View className="flex-1">
                        <Text className="text-xs text-secondary-foreground">{t`Total`}</Text>
                        <Text className="text-lg text-primary font-semibold">{total}</Text>
                    </View>
                    <View className="flex-1">
                        <Text className="text-xs text-secondary-foreground">{t`Average`}</Text>
                        <Text className="text-lg text-primary font-semibold">{average}</Text>
                    </View>
                </View>
            ) : null}

            {hasStats ? (
                <View className="flex-row items-end gap-x-sm h-[116px]">
                    {stats.months.map(month => {
                        const height = Math.max(8, Math.round((month.totalAmount / maxAmount) * BAR_MAX_HEIGHT));
                        const label = month.monthKey.slice(5);

                        return <TransactionInfoSimilarBar key={month.monthKey} height={height} label={label} />;
                    })}
                </View>
            ) : null}
        </Card>
    );
};
