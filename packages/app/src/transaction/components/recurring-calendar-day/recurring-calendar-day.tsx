import { Pressable, Text, View } from 'react-native';
import { CalendarDay } from 'react-native-ui-datepicker';

import { cn } from '../../../@generic/utils/cn.util';
import { RecurringCalendarEntryInterface } from '../../interface/recurring-calendar-entry.interface';

const MAX_VISIBLE_DOTS = 3;

interface Props {
    readonly day: CalendarDay;
    readonly entriesByDay: ReadonlyMap<number, readonly RecurringCalendarEntryInterface[]>;
    readonly selectedDay: number | undefined;
    readonly onSelectDay: (day: number) => void;
}

export const RecurringCalendarDay = ({ day, entriesByDay, selectedDay, onSelectDay }: Props) => {
    const dayOfMonth = day.dayOfMonth ?? Number(day.text);
    const entries = day.isCurrentMonth ? entriesByDay.get(dayOfMonth) : null;
    const entryCount = entries?.length ?? 0;
    const hasEntries = entryCount > 0;
    const isSelected = selectedDay === dayOfMonth && day.isCurrentMonth;
    const isOtherMonth = !day.isCurrentMonth;
    const visibleDots = Math.min(entryCount, MAX_VISIBLE_DOTS);

    const handlePress = () => {
        if (day.isCurrentMonth && hasEntries) {
            onSelectDay(dayOfMonth);
        }
    };

    /* eslint-disable lingui/no-unlocalized-strings */
    const wrapperClassName = cn(
        'items-center justify-center rounded-full aspect-square mx-0.5',
        isOtherMonth && 'opacity-20',
        hasEntries && !isSelected && 'bg-destructive-corner/20',
        day.isToday && !isSelected && 'border-2 border-primary',
        isSelected && 'bg-primary'
    );

    const textClassName = cn(
        'text-sm font-medium',
        !hasEntries && !isSelected && 'text-secondary-foreground',
        hasEntries && !isSelected && 'text-destructive font-bold',
        day.isToday && !isSelected && 'text-primary font-bold',
        isSelected && 'text-primary-reverse font-bold'
    );

    const dotClassName = cn('h-1 w-1 rounded-full', isSelected ? 'bg-primary-reverse' : 'bg-destructive');
    /* eslint-enable lingui/no-unlocalized-strings */

    return (
        <Pressable className={wrapperClassName} onPress={handlePress}>
            <Text className={textClassName}>{day.text}</Text>

            {hasEntries && day.isCurrentMonth ? (
                <View className="absolute bottom-1.5 flex-row gap-x-0.5">
                    {Array.from({ length: visibleDots }, (_, index) => (
                        <View key={index} className={dotClassName} />
                    ))}
                </View>
            ) : null}
        </Pressable>
    );
};
