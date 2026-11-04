import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui, Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';
import { Directions, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { CalendarComponents, DateType } from 'react-native-ui-datepicker';

import { isDefined } from '@rnw-community/shared';

import { DatePicker } from '../../../@generic/component/date-picker/date-picker';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useToday } from '../../../@generic/hook/use-today.hook';
import { dateTypeToDate } from '../../../@generic/utils/date/date-type-to-date.util';
import { useLocaleInfo } from '../../../i18n/hook/use-locale-info.hook';
import { RecurringCalendarSelector } from '../recurring-calendar-content/recurring-calendar.selector';
import { RecurringCalendarDayDots } from '../recurring-calendar-day-dots/recurring-calendar-day-dots';
import { RecurringCalendarDay } from '../recurring-calendar-day/recurring-calendar-day';
import { RecurringCalendarWeekday } from '../recurring-calendar-weekday/recurring-calendar-weekday';

import type { RecurringCalendarEntryInterface } from '@budgie/recurring';

const CALENDAR_CONTAINER_HEIGHT = 289;
const CALENDAR_ROW_HEIGHT = 44;
const dayTouchTargetStyle = { minHeight: CALENDAR_ROW_HEIGHT };
const calendarDayStyles = { day: dayTouchTargetStyle, today: dayTouchTargetStyle, selected: dayTouchTargetStyle };

interface Props {
    readonly entriesByDay: ReadonlyMap<number, readonly RecurringCalendarEntryInterface[]>;
    readonly forecastedEntriesByDay: ReadonlyMap<number, readonly RecurringCalendarEntryInterface[]>;
    readonly selectedDay: number | undefined;
    readonly onSelectDay: (day: number) => void;
    readonly displayMonth: number;
    readonly displayYear: number;
    readonly onChangeMonth: (year: number, month: number) => void;
}

// eslint-disable-next-line max-statements, max-lines-per-function -- Component with shared date-picker integration and month navigation logic
export const RecurringCalendarGrid = (props: Props) => {
    const { entriesByDay, forecastedEntriesByDay, selectedDay, onSelectDay, displayMonth, displayYear, onChangeMonth } = props;

    const { t } = useLingui();
    const { languageTag } = useLocaleInfo();
    const now = useToday();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthLabel = new Intl.DateTimeFormat(languageTag, { month: 'long', year: 'numeric' }).format(
        new Date(displayYear, displayMonth, 1)
    );
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

    const nextMonthAccessibilityState = { disabled: isCurrentMonthDisplayed };
    const nextChevronClassName = isCurrentMonthDisplayed ? 'text-secondary-foreground opacity-0' : 'text-primary';

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
    const renderWeekday: CalendarComponents['Weekday'] = weekday => <RecurringCalendarWeekday weekday={weekday} />;
    const components: CalendarComponents = { Day: renderDay, Weekday: renderWeekday };
    const calendarContainerStyle = {
        maxHeight:
            new Date(displayYear, displayMonth, 1).getDay() + new Date(displayYear, displayMonth + 1, 0).getDate() > 35
                ? CALENDAR_CONTAINER_HEIGHT
                : CALENDAR_CONTAINER_HEIGHT - CALENDAR_ROW_HEIGHT
    };
    const hasRecordedEntries = entriesByDay.size > 0;
    const hasExpectedEntries = forecastedEntriesByDay.size > 0;
    const hasEntries = hasRecordedEntries || hasExpectedEntries;

    const handleDateChange = (value: { date: DateType }) => {
        const date = dateTypeToDate(value.date);

        if (!isDefined(date)) {
            return;
        }

        if (date.getFullYear() !== displayYear || date.getMonth() !== displayMonth) {
            return;
        }

        onSelectDay(date.getDate());
    };

    const disabledDates = (value: DateType) => {
        const date = dateTypeToDate(value);

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
                        accessibilityRole="button"
                        accessibilityLabel={t`Previous month`}
                        hitSlop={12}
                        className="min-h-[44px] min-w-[44px] items-center justify-center"
                        testID={RecurringCalendarSelector.PreviousMonthButton}
                    >
                        <Icon icon={UserIconNameEnum.ChevronLeft} className="text-primary" size={20} />
                    </HapticPressable>
                    <HapticPressable
                        onPress={handleCurrentMonth}
                        className="min-h-[44px] flex-1 items-center justify-center"
                        accessibilityRole="button"
                        accessibilityLabel={monthLabel}
                        accessibilityHint={t`Today`}
                        testID={RecurringCalendarSelector.MonthLabel}
                    >
                        <Text
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.6}
                            maxFontSizeMultiplier={2}
                            className="text-primary text-[17px] font-semibold capitalize"
                        >
                            {monthLabel}
                        </Text>
                    </HapticPressable>
                    <HapticPressable
                        onPress={handleNextMonth}
                        accessibilityRole="button"
                        accessibilityLabel={t`Next month`}
                        accessibilityState={nextMonthAccessibilityState}
                        hitSlop={12}
                        className="min-h-[44px] min-w-[44px] items-center justify-center"
                        disabled={isCurrentMonthDisplayed}
                        testID={RecurringCalendarSelector.NextMonthButton}
                    >
                        <Icon icon={UserIconNameEnum.ChevronRight} className={nextChevronClassName} size={20} />
                    </HapticPressable>
                </View>

                <DatePicker
                    key={datePickerKey}
                    mode="single"
                    containerHeight={CALENDAR_CONTAINER_HEIGHT}
                    styles={calendarDayStyles}
                    containerStyle={calendarContainerStyle}
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
                {hasEntries ? (
                    <View className="flex-row flex-wrap justify-center gap-x-5xl gap-y-sm pb-md" accessible>
                        {hasRecordedEntries ? (
                            <View className="flex-row items-center gap-x-sm">
                                <RecurringCalendarDayDots actualDots={1} forecastedDots={0} isSelected={false} className="static" />
                                <Text maxFontSizeMultiplier={1.5} className="text-[12px] text-secondary-foreground">
                                    <Trans>Recorded</Trans>
                                </Text>
                            </View>
                        ) : null}
                        {hasExpectedEntries ? (
                            <View className="flex-row items-center gap-x-sm">
                                <RecurringCalendarDayDots actualDots={0} forecastedDots={1} isSelected={false} className="static" />
                                <Text maxFontSizeMultiplier={1.5} className="text-[12px] text-secondary-foreground">
                                    <Trans>Expected</Trans>
                                </Text>
                            </View>
                        ) : null}
                    </View>
                ) : null}
            </View>
        </GestureDetector>
    );
};
