import { Pressable, Text } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
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
    const entries = day.isCurrentMonth ? entriesByDay.get(dayOfMonth) : null;
    const entryCount = entries?.length ?? 0;
    const hasEntries = entryCount > 0;
    const isSelected = selectedDay === dayOfMonth && day.isCurrentMonth;
    const isOtherMonth = !day.isCurrentMonth;

    const handlePress = () => {
        if (day.isCurrentMonth && hasEntries) {
            onSelectDay(dayOfMonth);
        }
    };

    /* eslint-disable lingui/no-unlocalized-strings */
    const wrapperClassName = cn(
        'items-center justify-center rounded-2xl aspect-square mx-0.5',
        isOtherMonth && 'opacity-20',
        hasEntries && !isSelected && 'bg-destructive-corner/30',
        day.isToday && !isSelected && 'border border-primary/40',
        isSelected && 'bg-primary'
    );

    const textClassName = cn(
        'text-sm font-medium',
        !hasEntries && !isSelected && 'text-secondary-foreground',
        hasEntries && !isSelected && 'text-destructive font-bold',
        day.isToday && !isSelected && 'text-primary font-bold',
        isSelected && 'text-primary-reverse font-bold'
    );

    const badgeClassName = cn(
        'absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full items-center justify-center px-0.5',
        isSelected ? 'bg-primary-reverse' : 'bg-destructive'
    );

    const badgeTextClassName = cn('text-[9px] font-bold', isSelected ? 'text-primary' : 'text-destructive-foreground');
    /* eslint-enable lingui/no-unlocalized-strings */

    return (
        <Pressable className={wrapperClassName} onPress={handlePress}>
            <Text className={textClassName}>{day.text}</Text>

            {hasEntries && day.isCurrentMonth ? (
                <Animated.View entering={FadeIn.duration(200)} className={badgeClassName}>
                    <Text className={badgeTextClassName}>{entryCount}</Text>
                </Animated.View>
            ) : null}
        </Pressable>
    );
};
