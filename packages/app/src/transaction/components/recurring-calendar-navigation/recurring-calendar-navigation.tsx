import { ReactNode } from 'react';
import { View } from 'react-native';
import { Directions, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import { useToday } from '../../../@generic/hook/use-today.hook';
import { useLocaleInfo } from '../../../i18n/hook/use-locale-info.hook';
import { RecurringCalendarToolbar } from '../recurring-calendar-toolbar/recurring-calendar-toolbar';

interface Props {
    readonly displayMonth: number;
    readonly displayYear: number;
    readonly onChangeMonth: (year: number, month: number) => void;
    readonly children: ReactNode;
}

export const RecurringCalendarNavigation = ({ displayMonth, displayYear, onChangeMonth, children }: Props) => {
    const { languageTag } = useLocaleInfo();
    const now = useToday();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthLabel = new Intl.DateTimeFormat(languageTag, { month: 'long', year: 'numeric' }).format(
        new Date(displayYear, displayMonth, 1)
    );

    const isCurrentMonthDisplayed = displayMonth === currentMonth && displayYear === currentYear;

    const handlePrevMonth = () => {
        const isJanuary = displayMonth === 0;
        const newMonth = isJanuary ? 11 : displayMonth - 1;
        const newYear = isJanuary ? displayYear - 1 : displayYear;
        onChangeMonth(newYear, newMonth);
    };

    const handleCurrentMonth = () => void onChangeMonth(currentYear, currentMonth);

    const handleNextMonth = () => {
        if (isCurrentMonthDisplayed) {
            return;
        }

        const isDecember = displayMonth === 11;
        const newMonth = isDecember ? 0 : displayMonth + 1;
        const newYear = isDecember ? displayYear + 1 : displayYear;
        onChangeMonth(newYear, newMonth);
    };

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
                <RecurringCalendarToolbar
                    monthLabel={monthLabel}
                    isCurrentMonthDisplayed={isCurrentMonthDisplayed}
                    onPreviousMonth={handlePrevMonth}
                    onCurrentMonth={handleCurrentMonth}
                    onNextMonth={handleNextMonth}
                />
                {children}
            </View>
        </GestureDetector>
    );
};
