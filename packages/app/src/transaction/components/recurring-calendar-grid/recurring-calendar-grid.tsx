import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';
import { Directions, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { CalendarComponents, DateType } from 'react-native-ui-datepicker';

import { isDefined } from '@rnw-community/shared';

import { DatePicker } from '../../../@generic/component/date-picker/date-picker';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useLocaleInfo } from '../../../i18n/hook/use-locale-info.hook';
import { RecurringCalendarEntryInterface } from '../../interface/recurring-calendar-entry.interface';
import { getMonthLabel } from '../../utils/get-month-label.util';
import { RecurringCalendarSelector } from '../recurring-calendar-content/recurring-calendar.selector';
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

const resolveDateType = (value: DateType): Date | null => {
    if (!isDefined(value)) {
        return null;
    }

    if (value instanceof Date) {
        return new Date(value.getTime());
    }

    if (typeof value === 'number' || typeof value === 'string') {
        return new Date(value);
    }

    if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
        return value.toDate();
    }

    return new Date(value.toString());
};

// eslint-disable-next-line max-statements, max-lines-per-function -- Component with shared date-picker integration and month navigation logic
export const RecurringCalendarGrid = (props: Props) => {
    const { entriesByDay, forecastedEntriesByDay, selectedDay, onSelectDay, displayMonth, displayYear, onChangeMonth } = props;

    const { languageTag } = useLocaleInfo();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthLabel = getMonthLabel(displayYear, displayMonth, languageTag);
    const maxDate = new Date(currentYear, currentMonth + 1, 0);
    const selectedDate = isDefined(selectedDay) ? new Date(displayYear, displayMonth, selectedDay, 12, 0, 0, 0) : null;
    const datePickerKey = `${displayYear}-${displayMonth}-${selectedDay ?? 'none'}`;

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
    const renderDay: CalendarComponents['Day'] = day => (
        <RecurringCalendarDay day={day} entriesByDay={entriesByDay} forecastedEntriesByDay={forecastedEntriesByDay} />
    );
    const components: CalendarComponents = { Day: renderDay };

    const handleDateChange = (value: { date: DateType }) => {
        const date = resolveDateType(value.date);

        if (!isDefined(date)) {
            return;
        }

        if (date.getFullYear() !== displayYear || date.getMonth() !== displayMonth) {
            return;
        }

        onSelectDay(date.getDate());
    };

    const disabledDates = (value: DateType) => {
        const date = resolveDateType(value);

        if (!isDefined(date)) {
            return false;
        }

        return date.getFullYear() !== displayYear || date.getMonth() !== displayMonth;
    };

    return (
        <GestureDetector gesture={swipeGesture}>
            <View className="gap-y-sm">
                <View className="flex-row items-center justify-between">
                    <HapticPressable
                        onPress={handlePrevMonth}
                        hitSlop={12}
                        className="p-sm"
                        testID={RecurringCalendarSelector.PreviousMonthButton}
                    >
                        <Icon icon={UserIconNameEnum.ChevronLeft} className="text-primary" size={20} />
                    </HapticPressable>
                    <Text className="text-primary text-sm font-semibold capitalize" testID={RecurringCalendarSelector.MonthLabel}>
                        {monthLabel}
                    </Text>
                    <HapticPressable
                        onPress={handleNextMonth}
                        hitSlop={12}
                        className="p-sm"
                        disabled={isCurrentMonthDisplayed}
                        testID={RecurringCalendarSelector.NextMonthButton}
                    >
                        <Icon icon={UserIconNameEnum.ChevronRight} className={nextChevronClassName} size={20} />
                    </HapticPressable>
                </View>

                <DatePicker
                    key={datePickerKey}
                    mode="single"
                    hideHeader
                    showOutsideDays
                    month={displayMonth}
                    year={displayYear}
                    maxDate={maxDate}
                    onChange={handleDateChange}
                    disabledDates={disabledDates}
                    components={components}
                    {...(isDefined(selectedDate) && { date: selectedDate })}
                />
            </View>
        </GestureDetector>
    );
};
