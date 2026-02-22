import { Pressable, Text, View } from 'react-native';
import { CalendarDay } from 'react-native-ui-datepicker';

import { cn } from '../../../@generic/utils/cn.util';
import { RecurringCalendarEntryInterface } from '../../interface/recurring-calendar-entry.interface';

interface Props {
    readonly day: CalendarDay;
    readonly entriesByDay: ReadonlyMap<number, readonly RecurringCalendarEntryInterface[]>;
    readonly selectedDay: number | undefined;
    readonly onSelectDay: (day: number) => void;
}

export const RecurringCalendarDay = ({ day, entriesByDay, selectedDay, onSelectDay }: Props) => {
    const dayOfMonth = day.dayOfMonth ?? Number(day.text);
    const hasEntries = entriesByDay.has(dayOfMonth);
    const isSelected = selectedDay === dayOfMonth && day.isCurrentMonth;
    const isOtherMonth = !day.isCurrentMonth;
    const showDot = hasEntries && day.isCurrentMonth;

    const handlePress = () => {
        if (day.isCurrentMonth) {
            onSelectDay(dayOfMonth);
        }
    };

    /* eslint-disable lingui/no-unlocalized-strings */
    const wrapperClassName = cn(
        'items-center justify-center rounded-full aspect-square',
        day.isToday && !isSelected && 'bg-primary/20',
        isSelected && 'bg-primary'
    );

    const textClassName = cn(
        'text-sm',
        isOtherMonth && 'text-secondary-foreground/30',
        !isOtherMonth && hasEntries && 'text-primary font-semibold',
        day.isToday && !isSelected && 'text-primary font-semibold',
        isSelected && 'text-primary-reverse font-semibold'
    );

    const dotClassName = cn('absolute bottom-1 h-[5px] w-[5px] rounded-full', isSelected ? 'bg-primary-reverse' : 'bg-destructive-corner');
    /* eslint-enable lingui/no-unlocalized-strings */

    return (
        <Pressable className={wrapperClassName} onPress={handlePress}>
            <Text className={textClassName}>{day.text}</Text>

            {showDot ? <View className={dotClassName} /> : null}
        </Pressable>
    );
};
