import { convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { isSameMonth } from 'date-fns';
import { Text, View } from 'react-native';

import { MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/max-font-size-multiplier.constant';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';

import type { StatisticsTrendPointInterface } from '../../interface/statistics-trend-point.interface';

interface Props {
    readonly points: readonly StatisticsTrendPointInterface[];
    readonly currentMonth: Date;
    readonly currencySymbol: string;
}

const MIN_BAR_RATIO = 0.04;
const PERCENT = 100;

const barVariants = cva('w-full rounded-t-[4px] rounded-b-[2px]', {
    variants: { isCurrent: { true: 'bg-primary', false: 'bg-secondary-foreground/30' } }
});

const monthLabelVariants = cva('flex-1 text-center text-xxs', {
    variants: { isCurrent: { true: 'font-semibold text-primary', false: 'text-secondary-foreground' } }
});

export const StatisticsTrendBars = ({ points, currentMonth, currencySymbol }: Props) => {
    const { t } = useLingui();
    const { formatShortMonth, formatFullMonthAndYear } = useFormatDate();
    const formatProtectedAmount = useProtectedAmountLabel();

    const maxAmount = Math.max(...points.map(point => point.amount), 0);
    const bars = points.map(point => {
        const ratio = maxAmount > 0 ? Math.max(point.amount / maxAmount, MIN_BAR_RATIO) : MIN_BAR_RATIO;
        const isCurrent = isSameMonth(point.month, currentMonth);
        const monthLabel = formatFullMonthAndYear(point.month);
        const amountLabel = formatProtectedAmount(convertFromMicroUnits(point.amount), currencySymbol);

        return {
            key: point.month.getTime(),
            shortLabel: formatShortMonth(point.month),
            spokenLabel: t`${monthLabel}: ${amountLabel}`,
            barClassName: barVariants({ isCurrent }),
            labelClassName: monthLabelVariants({ isCurrent }),
            barStyle: { height: `${ratio * PERCENT}%` as const }
        };
    });
    const summary = bars.map(bar => bar.spokenLabel).join(', ');

    return (
        <View accessible accessibilityLabel={t`Last 6 months. ${summary}`} className="gap-y-xs">
            <View className="h-[48px] flex-row items-end gap-x-md">
                {bars.map(bar => (
                    <View key={bar.key} className="h-full flex-1 justify-end">
                        <View className={bar.barClassName} style={bar.barStyle} />
                    </View>
                ))}
            </View>

            <View className="flex-row gap-x-md">
                {bars.map(bar => (
                    <Text key={bar.key} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} className={bar.labelClassName}>
                        {bar.shortLabel}
                    </Text>
                ))}
            </View>
        </View>
    );
};
