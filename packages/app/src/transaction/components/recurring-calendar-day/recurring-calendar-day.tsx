import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { cn } from '../../../@generic/utils/cn.util';
import { RecurringCalendarEntryInterface } from '../../interface/recurring-calendar-entry.interface';

const MAX_DOTS = 3;

interface Props {
    readonly day: number;
    readonly isCurrentMonth: boolean;
    readonly isToday: boolean;
    readonly entriesByDay: ReadonlyMap<number, readonly RecurringCalendarEntryInterface[]>;
    readonly forecastedEntriesByDay: ReadonlyMap<number, readonly RecurringCalendarEntryInterface[]>;
    readonly selectedDay: number | undefined;
    readonly onSelectDay: (day: number) => void;
}

// eslint-disable-next-line max-statements, complexity -- Calendar day with actual + forecasted dot rendering and conditional styles
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

    /* eslint-disable lingui/no-unlocalized-strings */
    const circleClassName = cn(
        'w-10 h-10 items-center justify-center rounded-full',
        !isCurrentMonth && 'opacity-30',
        hasEntries && !isSelected && !hasOnlyForecasted && 'bg-warning-background',
        hasOnlyForecasted && !isSelected && 'bg-warning-background opacity-50',
        isToday && !isSelected && 'border-2 border-primary',
        isSelected && 'bg-primary'
    );

    const textClassName = cn(
        'text-sm',
        !hasEntries && !isSelected && 'text-secondary-foreground',
        hasEntries && !isSelected && 'text-primary font-semibold',
        isToday && !isSelected && 'text-primary font-semibold',
        isSelected && 'text-primary-reverse font-semibold'
    );

    const solidDotClassName = cn('h-1 w-1 rounded-full', isSelected ? 'bg-primary-reverse' : 'bg-warning-foreground');
    const hollowDotClassName = cn(
        'h-1 w-1 rounded-full',
        isSelected ? 'border border-primary-reverse' : 'border border-warning-foreground'
    );
    /* eslint-enable lingui/no-unlocalized-strings */

    return (
        <HapticPressable className="flex-1 items-center py-px" onPress={handlePress}>
            <View className={circleClassName}>
                <Text className={cn(textClassName, hasEntries && isCurrentMonth && '-mt-1')}>{day}</Text>
                {hasEntries && isCurrentMonth ? (
                    <View className="flex-row gap-x-0.5 -mt-0.5">
                        {Array.from({ length: actualDots }, (_, index) => (
                            <View key={`a-${index}`} className={solidDotClassName} />
                        ))}
                        {Array.from({ length: forecastedDots }, (_, index) => (
                            <View key={`f-${index}`} className={hollowDotClassName} />
                        ))}
                    </View>
                ) : null}
            </View>
        </HapticPressable>
    );
};
