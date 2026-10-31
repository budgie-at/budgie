import { convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { isSameMonth } from 'date-fns';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/footnote-max-font-size-multiplier.constant';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { StatisticsTrendBar } from '../statistics-trend-bar/statistics-trend-bar';

import type { StatisticsTrendPointInterface } from '../../interface/statistics-trend-point.interface';

interface Props {
    readonly points: readonly StatisticsTrendPointInterface[];
    readonly currentMonth: Date;
    readonly currencySymbol: string;
}

const PROTECTED_BAR_RATIO = 0.5;

export const StatisticsTrendBars = ({ points, currentMonth, currencySymbol }: Props) => {
    const { t } = useLingui();
    const { formatShortMonth, formatFullMonthAndYear } = useFormatDate();
    const formatProtectedAmount = useProtectedAmountLabel();
    const isAmountProtected = useIsAmountProtected();
    const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);

    const maxAmount = Math.max(...points.map(point => point.amount), 0);
    const averageAmount = points.reduce((sum, point) => sum + point.amount, 0) / Math.max(points.length, 1);
    const selectedPoint = points.find(point => isDefined(selectedMonth) && isSameMonth(point.month, selectedMonth));
    const readoutLabel = isDefined(selectedPoint) ? formatFullMonthAndYear(selectedPoint.month) : t`Monthly average`;
    const readoutAmountLabel = formatProtectedAmount(convertFromMicroUnits(selectedPoint?.amount ?? averageAmount), currencySymbol);

    return (
        <View className="gap-y-md">
            <View className="flex-row flex-wrap items-baseline justify-between gap-x-md" accessibilityLiveRegion="polite">
                <Text maxFontSizeMultiplier={FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER} className="text-xs font-medium text-secondary-foreground">
                    {readoutLabel}
                </Text>
                <Text maxFontSizeMultiplier={FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER} className="text-sm font-semibold tabular-nums text-primary">
                    {readoutAmountLabel}
                </Text>
            </View>

            <View>
                <View className="absolute inset-x-0 top-[72px] h-hairline bg-surface-separator" pointerEvents="none" />

                <View className="flex-row gap-x-md">
                    {points.map(point => {
                        const monthLabel = formatFullMonthAndYear(point.month);
                        const amountLabel = formatProtectedAmount(convertFromMicroUnits(point.amount), currencySymbol);
                        const scaledRatio = maxAmount > 0 ? point.amount / maxAmount : 0;
                        const ratio = isAmountProtected ? PROTECTED_BAR_RATIO : scaledRatio;
                        const isSelected = isDefined(selectedMonth) && isSameMonth(point.month, selectedMonth);
                        const handlePress = () => void setSelectedMonth(isSelected ? null : point.month);

                        return (
                            <StatisticsTrendBar
                                key={point.month.getTime()}
                                label={formatShortMonth(point.month)}
                                accessibilityLabel={t`${monthLabel}: ${amountLabel}`}
                                ratio={ratio}
                                isSelected={isSelected}
                                isCurrent={isSameMonth(point.month, currentMonth)}
                                onPress={handlePress}
                            />
                        );
                    })}
                </View>
            </View>
        </View>
    );
};
