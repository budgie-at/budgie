import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { cn } from '../../../@generic/utils/cn.util';
import { RecurringCalendarEntryInterface } from '../../interface/recurring-calendar-entry.interface';

const MAX_DOTS = 3;

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
        { hasOnlyForecasted: true, isSelected: false, className: 'bg-warning-background opacity-50' },
        { isToday: true, isSelected: false, className: 'border-2 border-primary' }
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
    readonly day: number;
    readonly isCurrentMonth: boolean;
    readonly isToday: boolean;
    readonly entriesByDay: ReadonlyMap<number, readonly RecurringCalendarEntryInterface[]>;
    readonly forecastedEntriesByDay: ReadonlyMap<number, readonly RecurringCalendarEntryInterface[]>;
    readonly selectedDay: number | undefined;
    readonly onSelectDay: (day: number) => void;
}

// eslint-disable-next-line max-statements -- Calendar day with actual + forecasted dot rendering and conditional styles
export const RecurringCalendarDay = (props: Props) => {
    const { day, isCurrentMonth, isToday, entriesByDay, forecastedEntriesByDay, selectedDay, onSelectDay } = props;

    const entries = isCurrentMonth ? entriesByDay.get(day) : null;
    const forecastedEntries = isCurrentMonth ? forecastedEntriesByDay.get(day) : null;
    const entryCount = entries?.length ?? 0;
    const forecastedCount = forecastedEntries?.length ?? 0;
    const totalCount = entryCount + forecastedCount;
    const hasEntries = totalCount > 0;
    const hasOnlyForecasted = entryCount === 0 && forecastedCount > 0;
    const isSelected = selectedDay === day && isCurrentMonth;

    const actualDots = Math.min(entryCount, MAX_DOTS);
    const remainingSlots = MAX_DOTS - actualDots;
    const forecastedDots = Math.min(forecastedCount, remainingSlots);

    const handlePress = () => {
        if (isCurrentMonth && hasEntries) {
            onSelectDay(day);
        }
    };

    const circleClassName = circleVariants({ isCurrentMonth, isSelected, hasEntries, hasOnlyForecasted, isToday });
    const textClassName = textVariants({ hasEntries, isSelected, isToday });

    return (
        <HapticPressable className="flex-1 items-center py-px" onPress={handlePress}>
            <View className={circleClassName}>
                <Text className={cn(textClassName, hasEntries && isCurrentMonth && '-mt-1')}>{day}</Text>
                {hasEntries && isCurrentMonth ? (
                    <View className="flex-row gap-x-0.5 -mt-0.5">
                        {Array.from({ length: actualDots }, (_, index) => (
                            <View key={`a-${index}`} className={dotVariants({ isSelected, type: 'solid' })} />
                        ))}
                        {Array.from({ length: forecastedDots }, (_, index) => (
                            <View key={`f-${index}`} className={dotVariants({ isSelected, type: 'hollow' })} />
                        ))}
                    </View>
                ) : null}
            </View>
        </HapticPressable>
    );
};
