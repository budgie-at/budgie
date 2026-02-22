import { UserIconNameEnum } from '@budgie/contracts';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { useLocaleInfo } from '../../../i18n/hook/use-locale-info.hook';
import { RecurringCalendarEntryInterface } from '../../interface/recurring-calendar-entry.interface';
import { getCalendarDays } from '../../utils/get-calendar-days.util';
import { RecurringCalendarDay } from '../recurring-calendar-day/recurring-calendar-day';

const MONDAY_OFFSET = 6;
const MONDAY_REFERENCE_YEAR = 2025;
const DAYS_IN_WEEK = 7;

interface Props {
    readonly entriesByDay: ReadonlyMap<number, readonly RecurringCalendarEntryInterface[]>;
    readonly selectedDay: number | undefined;
    readonly onSelectDay: (day: number) => void;
}

const getWeekdayNames = (locale: string): string[] =>
    Array.from({ length: DAYS_IN_WEEK }, (_, i) =>
        new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(new Date(MONDAY_REFERENCE_YEAR, 0, MONDAY_OFFSET + i))
    );

const getMonthLabel = (year: number, month: number, locale: string): string =>
    new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(year, month, 1));

export const RecurringCalendarGrid = ({ entriesByDay, selectedDay, onSelectDay }: Props) => {
    const { languageTag } = useLocaleInfo();
    const now = new Date();
    const [displayMonth, setDisplayMonth] = useState(now.getMonth());
    const [displayYear, setDisplayYear] = useState(now.getFullYear());

    const weekdays = getWeekdayNames(languageTag);
    const rows = getCalendarDays(displayYear, displayMonth);
    const monthLabel = getMonthLabel(displayYear, displayMonth, languageTag);

    const handlePrevMonth = () => {
        const isJanuary = displayMonth === 0;
        setDisplayMonth(isJanuary ? 11 : displayMonth - 1);
        if (isJanuary) {
            setDisplayYear(displayYear - 1);
        }
    };

    const handleNextMonth = () => {
        const isDecember = displayMonth === 11;
        setDisplayMonth(isDecember ? 0 : displayMonth + 1);
        if (isDecember) {
            setDisplayYear(displayYear + 1);
        }
    };

    return (
        <View className="gap-y-md">
            <View className="flex-row items-center justify-between">
                <Pressable onPress={handlePrevMonth} hitSlop={12} className="p-sm">
                    <Icon icon={UserIconNameEnum.ChevronLeft} className="text-primary" size={20} />
                </Pressable>
                <Text className="text-primary text-base font-semibold capitalize">{monthLabel}</Text>
                <Pressable onPress={handleNextMonth} hitSlop={12} className="p-sm">
                    <Icon icon={UserIconNameEnum.ChevronRight} className="text-primary" size={20} />
                </Pressable>
            </View>

            <View className="flex-row">
                {weekdays.map((name, index) => (
                    <View key={index} className="flex-1 items-center pb-sm">
                        <Text className="text-xs text-secondary-foreground font-semibold uppercase">{name}</Text>
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
                            selectedDay={selectedDay}
                            onSelectDay={onSelectDay}
                        />
                    ))}
                </View>
            ))}
        </View>
    );
};
