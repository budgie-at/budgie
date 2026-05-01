import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { CalendarDay as DatePickerCalendarDay } from 'react-native-ui-datepicker';

import { isDefined } from '@rnw-community/shared';

import { cn } from '../../../@generic/utils/cn.util';
import { RecurringCalendarEntryInterface } from '../../interface/recurring-calendar-entry.interface';
import { RecurringCalendarSelector } from '../recurring-calendar-content/recurring-calendar.selector';

const MAX_DOTS = 3;
const DOT_STAGGER_MS = 4;
const DOT_FADE_MS = 200;

const circleVariants = cva('w-10 h-10 items-center justify-center rounded-full', {
    variants: {
        isCurrentMonth: {
            true: '',
            false: 'opacity-30'
        },
        isSelected: {
            true: 'bg-primary',
            false: ''
        },
        hasEntries: {
            true: '',
            false: ''
        },
        hasOnlyForecasted: {
            true: '',
            false: ''
        },
        isToday: {
            true: '',
            false: ''
        }
    },
    compoundVariants: [
        { hasEntries: true, isSelected: false, hasOnlyForecasted: false, className: 'bg-warning-background' },
        { hasOnlyForecasted: true, isSelected: false, className: 'bg-warning-background opacity-50' }
    ]
});

const textVariants = cva('text-sm', {
    variants: {
        hasEntries: {
            true: '',
            false: ''
        },
        isSelected: {
            true: 'text-primary-reverse font-semibold',
            false: ''
        },
        isToday: {
            true: '',
            false: ''
        }
    },
    compoundVariants: [
        { hasEntries: false, isSelected: false, className: 'text-secondary-foreground' },
        { hasEntries: true, isSelected: false, className: 'text-primary font-semibold' },
        { isToday: true, isSelected: false, className: 'text-primary font-semibold' }
    ]
});

const dotVariants = cva('h-1 w-1 rounded-full', {
    variants: {
        isSelected: {
            true: '',
            false: ''
        },
        type: {
            solid: '',
            hollow: ''
        }
    },
    compoundVariants: [
        { type: 'solid', isSelected: true, className: 'bg-primary-reverse' },
        { type: 'solid', isSelected: false, className: 'bg-warning-foreground' },
        { type: 'hollow', isSelected: true, className: 'border border-primary-reverse' },
        { type: 'hollow', isSelected: false, className: 'border border-warning-foreground' }
    ]
});

interface Props {
    readonly day: DatePickerCalendarDay;
    readonly entriesByDay: ReadonlyMap<number, readonly RecurringCalendarEntryInterface[]>;
    readonly forecastedEntriesByDay: ReadonlyMap<number, readonly RecurringCalendarEntryInterface[]>;
}

// eslint-disable-next-line max-statements -- Calendar day with actual + forecasted dot rendering and conditional styles
export const RecurringCalendarDay = (props: Props) => {
    const { day, entriesByDay, forecastedEntriesByDay } = props;
    const dayOfMonth = day.number;

    const entries = day.isCurrentMonth ? entriesByDay.get(dayOfMonth) : null;
    const forecastedEntries = day.isCurrentMonth ? forecastedEntriesByDay.get(dayOfMonth) : null;
    const entryCount = entries?.length ?? 0;
    const forecastedCount = forecastedEntries?.length ?? 0;
    const totalCount = entryCount + forecastedCount;
    const hasEntries = totalCount > 0;
    const hasOnlyForecasted = entryCount === 0 && forecastedCount > 0;
    const { isSelected } = day;

    const actualDots = Math.min(entryCount, MAX_DOTS);
    const remainingSlots = MAX_DOTS - actualDots;
    const forecastedDots = Math.min(forecastedCount, remainingSlots);

    const circleClassName = circleVariants({
        isCurrentMonth: day.isCurrentMonth,
        isSelected,
        hasEntries,
        hasOnlyForecasted,
        isToday: day.isToday
    });
    const textClassName = textVariants({ hasEntries, isSelected, isToday: day.isToday });
    const hasDots = hasEntries && day.isCurrentMonth;
    const dayTextClassName = cn(textClassName, hasDots && '-mt-1');
    const isCurrentMonthToday = day.isToday && day.isCurrentMonth;
    const hasCurrentMonthDaySelector = day.isCurrentMonth && !day.isToday;
    let testID = null;

    if (isCurrentMonthToday) {
        testID = RecurringCalendarSelector.Today;
    } else if (hasCurrentMonthDaySelector) {
        testID = RecurringCalendarSelector.CurrentMonthDay(dayOfMonth);
    }

    return (
        <View className="items-center py-px">
            <View className={circleClassName} accessible={isDefined(testID)} {...(isDefined(testID) && { testID })}>
                <Text className={dayTextClassName}>{day.text}</Text>
                {hasDots ? (
                    <Animated.View
                        entering={FadeIn.delay(dayOfMonth * DOT_STAGGER_MS).duration(DOT_FADE_MS)}
                        className="flex-row gap-x-0.5 -mt-0.5"
                    >
                        {Array.from({ length: actualDots }, (_, index) => (
                            <View key={`a-${index}`} className={dotVariants({ isSelected, type: 'solid' })} />
                        ))}
                        {Array.from({ length: forecastedDots }, (_, index) => (
                            <View key={`f-${index}`} className={dotVariants({ isSelected, type: 'hollow' })} />
                        ))}
                    </Animated.View>
                ) : null}
            </View>
        </View>
    );
};
