import { Pressable, Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { cn } from '../../../@generic/utils/cn.util';
import { RecurringCalendarEntryInterface } from '../../interface/recurring-calendar-entry.interface';

interface CalendarDayInterface {
    readonly number: number;
    readonly text: string;
    readonly isCurrentMonth: boolean;
    readonly isToday: boolean;
}

interface Props {
    readonly day: CalendarDayInterface;
    readonly entriesByDay: ReadonlyMap<number, readonly RecurringCalendarEntryInterface[]>;
    readonly selectedDay: number | undefined;
    readonly onSelectDay: (day: number) => void;
}

export const RecurringCalendarDay = ({ day, entriesByDay, selectedDay, onSelectDay }: Props) => {
    const entries = entriesByDay.get(day.number);
    const hasEntries = isDefined(entries);
    const isSelected = selectedDay === day.number && day.isCurrentMonth;
    const isOtherMonth = !day.isCurrentMonth;
    const showDot = hasEntries && day.isCurrentMonth;

    /* eslint-disable lingui/no-unlocalized-strings */
    const wrapperClassName = cn(
        'items-center justify-center rounded-full aspect-square',
        day.isToday && 'bg-primary/20',
        isSelected && 'bg-primary'
    );

    const textClassName = cn(
        'text-sm',
        isOtherMonth && 'text-secondary-foreground/30',
        day.isCurrentMonth && 'text-primary',
        day.isToday && 'text-primary font-semibold',
        isSelected && 'text-primary-reverse font-semibold'
    );

    const dotClassName = cn('absolute bottom-1 h-[5px] w-[5px] rounded-full', isSelected ? 'bg-primary-reverse' : 'bg-destructive-corner');
    /* eslint-enable lingui/no-unlocalized-strings */

    const handlePress = () => {
        if (day.isCurrentMonth && hasEntries) {
            onSelectDay(day.number);
        }
    };

    return (
        <Pressable className={wrapperClassName} onPress={handlePress}>
            <Text className={textClassName}>{day.text}</Text>

            {showDot ? <View className={dotClassName} /> : null}
        </Pressable>
    );
};
