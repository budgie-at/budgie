import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { EASE_OUT, MOTION_BASE_DURATION } from '../../../@generic/constant/motion.constant';
import { useToday } from '../../../@generic/hook/use-today.hook';
import { buildRecurringCalendarDays } from '../../utils/build-recurring-calendar-days.util';
import { RecurringCalendarDay } from '../recurring-calendar-day/recurring-calendar-day';
import { RecurringCalendarLegend } from '../recurring-calendar-legend/recurring-calendar-legend';
import { RecurringCalendarNavigation } from '../recurring-calendar-navigation/recurring-calendar-navigation';
import { RecurringCalendarWeekday } from '../recurring-calendar-weekday/recurring-calendar-weekday';

import type { RecurringCalendarEntryInterface } from '@budgie/recurring';

interface Props {
    readonly isLoading: boolean;
    readonly entriesByDay: ReadonlyMap<number, readonly RecurringCalendarEntryInterface[]>;
    readonly forecastedEntriesByDay: ReadonlyMap<number, readonly RecurringCalendarEntryInterface[]>;
    readonly selectedDay: number | undefined;
    readonly onSelectDay: (day: number) => void;
    readonly displayMonth: number;
    readonly displayYear: number;
    readonly onChangeMonth: (year: number, month: number) => void;
}

const MONTH_ENTERING = FadeIn.duration(MOTION_BASE_DURATION).easing(EASE_OUT);

export const RecurringCalendarGrid = (props: Props) => {
    const { isLoading, entriesByDay, forecastedEntriesByDay, selectedDay, onSelectDay, displayMonth, displayYear, onChangeMonth } = props;
    const today = useToday();
    const days = buildRecurringCalendarDays(displayYear, displayMonth, selectedDay, today);
    const hasRecordedEntries = entriesByDay.size > 0;
    const hasExpectedEntries = forecastedEntriesByDay.size > 0;

    return (
        <RecurringCalendarNavigation displayMonth={displayMonth} displayYear={displayYear} onChangeMonth={onChangeMonth}>
            <Animated.View key={`${displayYear}-${displayMonth}`} entering={MONTH_ENTERING}>
                <View className="flex-row">
                    {days.slice(0, 7).map(day => (
                        <RecurringCalendarWeekday key={day.number} date={day.date} />
                    ))}
                </View>
                <View className="flex-row flex-wrap content-start">
                    {days.map(day => (
                        <RecurringCalendarDay
                            key={day.date.getTime()}
                            day={day}
                            onSelectDay={onSelectDay}
                            isLoading={isLoading}
                            entriesByDay={entriesByDay}
                            forecastedEntriesByDay={forecastedEntriesByDay}
                        />
                    ))}
                </View>
            </Animated.View>
            <RecurringCalendarLegend hasRecordedEntries={hasRecordedEntries} hasExpectedEntries={hasExpectedEntries} />
        </RecurringCalendarNavigation>
    );
};
