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
    readonly selectedDay: number | undefined;
    readonly onSelectDay: (day: number) => void;
}

export const RecurringCalendarDay = ({ day, isCurrentMonth, isToday, entriesByDay, selectedDay, onSelectDay }: Props) => {
    const entries = isCurrentMonth ? entriesByDay.get(day) : null;
    const entryCount = entries?.length ?? 0;
    const hasEntries = entryCount > 0;
    const isSelected = selectedDay === day && isCurrentMonth;
    const visibleDots = Math.min(entryCount, MAX_DOTS);

    const handlePress = () => {
        if (isCurrentMonth && hasEntries) {
            onSelectDay(day);
        }
    };

    /* eslint-disable lingui/no-unlocalized-strings */
    const circleClassName = cn(
        'w-10 h-10 items-center justify-center rounded-full',
        !isCurrentMonth && 'opacity-30',
        hasEntries && !isSelected && 'bg-warning-background',
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

    const dotClassName = cn('h-1 w-1 rounded-full', isSelected ? 'bg-primary-reverse' : 'bg-warning-foreground');
    /* eslint-enable lingui/no-unlocalized-strings */

    return (
        <HapticPressable className="flex-1 items-center py-px" onPress={handlePress}>
            <View className={circleClassName}>
                <Text className={textClassName}>{day}</Text>
            </View>

            {hasEntries && isCurrentMonth ? (
                <View className="flex-row gap-x-0.5 mt-0.5 h-1">
                    {Array.from({ length: visibleDots }, (_, index) => (
                        <View key={index} className={dotClassName} />
                    ))}
                </View>
            ) : (
                <View className="h-1 mt-0.5" />
            )}
        </HapticPressable>
    );
};
