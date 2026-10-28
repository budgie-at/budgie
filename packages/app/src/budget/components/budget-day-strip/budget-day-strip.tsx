import { useLingui } from '@lingui/react/macro';
import { isSameDay } from 'date-fns/isSameDay';
import { Text, View } from 'react-native';

import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { BUDGET_PACE_VARIANT } from '../../constant/budget-pace-variant.constant';
import { BudgetDayStateEnum } from '../../enum/budget-day-state.enum';
import { BudgetDayStripCell } from '../budget-day-strip-cell/budget-day-strip-cell';

import type { BudgetProjectionInterface } from '@budgie/budget';

interface Props {
    readonly projection: BudgetProjectionInterface;
}

export const BudgetDayStrip = ({ projection }: Props) => {
    const { t } = useLingui();
    const { formatMonthAndDay } = useFormatDate();
    const { days, elapsedDays, totalDays, upcomingCharges, overall } = projection;
    const tone = BUDGET_PACE_VARIANT[overall.status];
    const todayIndex = elapsedDays - 1;
    const accessibilityLabel = t`Day ${elapsedDays} of ${totalDays}`;

    const hasBillOn = (date: Date) => upcomingCharges.some(charge => isSameDay(charge.date, date));

    const resolveDayState = (index: number) => {
        if (index < todayIndex) {
            return BudgetDayStateEnum.ELAPSED;
        }

        return index === todayIndex ? BudgetDayStateEnum.TODAY : BudgetDayStateEnum.FUTURE;
    };

    return (
        <View accessible accessibilityLabel={accessibilityLabel} className="gap-y-sm">
            <View className="flex-row gap-x-[3px]" importantForAccessibility="no-hide-descendants">
                {days.map((day, index) => (
                    <BudgetDayStripCell
                        key={day.date.getTime()}
                        dayState={resolveDayState(index)}
                        tone={tone}
                        hasBill={hasBillOn(day.date)}
                    />
                ))}
            </View>
            <View className="flex-row justify-between">
                <Text className="text-xxs text-secondary-foreground">{formatMonthAndDay(days[0].date)}</Text>
                <Text className="text-xxs text-secondary-foreground">{formatMonthAndDay(days[days.length - 1].date)}</Text>
            </View>
        </View>
    );
};
