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

const circleVariants = cva('w-10 h-10 items-center justify-center rounded-full', {
    variants: {
        isCurrentMonth: { true: '', false: 'opacity-30' },
        isSelected: { true: 'bg-primary', false: '' },
        hasEntries: { true: '', false: '' },
        hasOnlyForecasted: { true: '', false: '' }
    },
    compoundVariants: [
        { hasEntries: true, isSelected: false, hasOnlyForecasted: false, className: 'bg-surface-fill' },
        { hasOnlyForecasted: true, isSelected: false, className: 'bg-surface-fill opacity-50' }
    ]
});

const textVariants = cva('text-sm', {
    variants: {
        hasEntries: { true: '', false: '' },
        isSelected: { true: 'text-primary-reverse font-semibold', false: '' },
        isToday: { true: '', false: '' }
    },
    compoundVariants: [
        { hasEntries: false, isSelected: false, className: 'text-secondary-foreground' },
        { hasEntries: true, isSelected: false, className: 'text-primary font-semibold' },
        { isToday: true, isSelected: false, className: 'text-primary font-semibold' }
    ]
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
    const hasOnlyForecasted = entryCount === 0 && forecastedCount > 0;
    const hasDots = hasEntries && isCurrentMonth;
    const actualDots = Math.min(entryCount, MAX_DOTS);
    const forecastedDots = Math.min(forecastedCount, MAX_DOTS - actualDots);
    const circleClassName = circleVariants({ isCurrentMonth, isSelected, hasEntries, hasOnlyForecasted });
    const dayTextClassName = cn(textVariants({ hasEntries, isSelected, isToday }), hasDots && '-mt-1');
    const dayTestID = isCurrentMonth ? RecurringCalendarSelector.CurrentMonthDay(dayOfMonth) : null;

    return (
        <View className="items-center py-px">
            <View className={circleClassName} accessible={isDefined(dayTestID)} {...testIDProps(dayTestID)}>
                <Text className={dayTextClassName}>{day.text}</Text>
                {hasDots ? (
                    <RecurringCalendarDayDots
                        dayOfMonth={dayOfMonth}
                        actualDots={actualDots}
                        forecastedDots={forecastedDots}
                        isSelected={isSelected}
                    />
                ) : null}
            </View>
        </View>
    );
};
