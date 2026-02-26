import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';
import { Directions, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useLocaleInfo } from '../../../i18n/hook/use-locale-info.hook';
import { RecurringCalendarEntryInterface } from '../../interface/recurring-calendar-entry.interface';
import { getCalendarDays } from '../../utils/get-calendar-days.util';
import { getMonthLabel } from '../../utils/get-month-label.util';
import { getWeekdayNames } from '../../utils/get-weekday-names.util';
import { RecurringCalendarDay } from '../recurring-calendar-day/recurring-calendar-day';

interface Props {
    readonly entriesByDay: ReadonlyMap<number, readonly RecurringCalendarEntryInterface[]>;
    readonly forecastedEntriesByDay: ReadonlyMap<number, readonly RecurringCalendarEntryInterface[]>;
    readonly selectedDay: number | undefined;
    readonly onSelectDay: (day: number) => void;
    readonly displayMonth: number;
    readonly displayYear: number;
    readonly onChangeMonth: (year: number, month: number) => void;
}

// eslint-disable-next-line max-statements -- Component with gesture handlers and month navigation logic
export const RecurringCalendarGrid = (props: Props) => {
    const { entriesByDay, forecastedEntriesByDay, selectedDay, onSelectDay, displayMonth, displayYear, onChangeMonth } = props;

    const { languageTag } = useLocaleInfo();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const weekdays = getWeekdayNames(languageTag);
    const rows = getCalendarDays(displayYear, displayMonth);
    const monthLabel = getMonthLabel(displayYear, displayMonth, languageTag);

    const isCurrentMonthDisplayed = displayMonth === currentMonth && displayYear === currentYear;

    const handlePrevMonth = () => {
        const isJanuary = displayMonth === 0;
        const newMonth = isJanuary ? 11 : displayMonth - 1;
        const newYear = isJanuary ? displayYear - 1 : displayYear;
        onChangeMonth(newYear, newMonth);
    };

    const handleNextMonth = () => {
        if (isCurrentMonthDisplayed) {
            return;
        }

        const isDecember = displayMonth === 11;
        const newMonth = isDecember ? 0 : displayMonth + 1;
        const newYear = isDecember ? displayYear + 1 : displayYear;
        onChangeMonth(newYear, newMonth);
    };

    const nextChevronClassName = isCurrentMonthDisplayed ? 'text-secondary-foreground opacity-30' : 'text-primary';

    const swipeLeft = Gesture.Fling()
        .direction(Directions.LEFT)
        .onEnd(() => {
            runOnJS(handleNextMonth)();
        });
    const swipeRight = Gesture.Fling()
        .direction(Directions.RIGHT)
        .onEnd(() => {
            runOnJS(handlePrevMonth)();
        });
    const swipeGesture = Gesture.Race(swipeLeft, swipeRight);

    return (
        <GestureDetector gesture={swipeGesture}>
            <View className="gap-y-sm">
                <View className="flex-row items-center justify-between">
                    <HapticPressable onPress={handlePrevMonth} hitSlop={12} className="p-sm">
                        <Icon icon={UserIconNameEnum.ChevronLeft} className="text-primary" size={20} />
                    </HapticPressable>
                    <Text className="text-primary text-sm font-semibold capitalize">{monthLabel}</Text>
                    <HapticPressable onPress={handleNextMonth} hitSlop={12} className="p-sm" disabled={isCurrentMonthDisplayed}>
                        <Icon icon={UserIconNameEnum.ChevronRight} className={nextChevronClassName} size={20} />
                    </HapticPressable>
                </View>

                <View className="flex-row">
                    {weekdays.map((name, index) => (
                        <View key={index} className="flex-1 items-center pb-xs">
                            <Text className="text-xxs text-secondary-foreground font-medium uppercase">{name}</Text>
                        </View>
                    ))}
                </View>

                {rows.map((row, rowIndex) => (
                    <View key={rowIndex} className="flex-row">
                        {row.map((dayData, columnIndex) => (
                            <RecurringCalendarDay
                                key={`${rowIndex}-${columnIndex}`}
                                day={dayData.day}
                                isCurrentMonth={dayData.isCurrentMonth}
                                isToday={dayData.isToday}
                                entriesByDay={entriesByDay}
                                forecastedEntriesByDay={forecastedEntriesByDay}
                                selectedDay={selectedDay}
                                onSelectDay={onSelectDay}
                            />
                        ))}
                    </View>
                ))}
            </View>
        </GestureDetector>
    );
};
