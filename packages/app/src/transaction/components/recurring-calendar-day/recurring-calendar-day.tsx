import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';
import { CalendarDay as DatePickerCalendarDay } from 'react-native-ui-datepicker';

import { isDefined } from '@rnw-community/shared';

import { cn } from '../../../@generic/utils/cn.util';
import { testID as testIDProps } from '../../../@generic/utils/test-id.util';
import { RecurringCalendarSelector } from '../recurring-calendar-content/recurring-calendar.selector';
import { RecurringCalendarDayDots } from '../recurring-calendar-day-dots/recurring-calendar-day-dots';

import type { RecurringCalendarEntryInterface } from '@budgie/recurring';

const MAX_DOTS = 3;

const circleVariants = cva('w-[40px] h-[40px] items-center justify-center rounded-full', {
    variants: {
        isSelected: { true: 'bg-primary', false: '' }
    }
});

const textVariants = cva('text-[15px] tabular-nums', {
    variants: {
        isCurrentMonth: { true: 'text-primary', false: 'text-secondary-foreground' },
        isSelected: { true: 'text-primary-reverse font-semibold', false: '' },
        isToday: { true: 'font-semibold', false: '' },
        hasEntries: { true: 'font-semibold', false: '' }
    }
});

interface Props {
    readonly day: DatePickerCalendarDay;
    readonly entriesByDay: ReadonlyMap<number, readonly RecurringCalendarEntryInterface[]>;
    readonly forecastedEntriesByDay: ReadonlyMap<number, readonly RecurringCalendarEntryInterface[]>;
}

export const RecurringCalendarDay = ({ day, entriesByDay, forecastedEntriesByDay }: Props) => {
    const dayOfMonth = day.number;
    const { isSelected, isCurrentMonth, isToday } = day;
    const entryCount = (isCurrentMonth ? entriesByDay.get(dayOfMonth)?.length : 0) ?? 0;
    const forecastedCount = (isCurrentMonth ? forecastedEntriesByDay.get(dayOfMonth)?.length : 0) ?? 0;
    const hasEntries = entryCount + forecastedCount > 0;
    const hasDots = hasEntries && isCurrentMonth;
    const actualDots = Math.min(entryCount, MAX_DOTS);
    const forecastedDots = Math.min(forecastedCount, MAX_DOTS - actualDots);
    const circleClassName = circleVariants({ isSelected });
    const dayTextClassName = cn(textVariants({ isCurrentMonth, isSelected, isToday, hasEntries }), hasDots && '-mt-1');
    const dayTestID = isCurrentMonth ? RecurringCalendarSelector.CurrentMonthDay(dayOfMonth) : null;

    return (
        <View className="items-center py-px">
            <View className={circleClassName} accessible={isDefined(dayTestID)} {...testIDProps(dayTestID)}>
                <Text maxFontSizeMultiplier={1.5} className={dayTextClassName}>
                    {day.text}
                </Text>
                {hasDots ? (
                    <RecurringCalendarDayDots actualDots={actualDots} forecastedDots={forecastedDots} isSelected={isSelected} />
                ) : null}
            </View>
        </View>
    );
};
