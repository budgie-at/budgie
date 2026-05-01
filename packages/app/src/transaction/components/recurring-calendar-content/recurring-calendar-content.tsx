import { Trans } from '@lingui/react/macro';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { MenuSpacer } from '../../../@generic/component/menu-spacer/menu-spacer';
import { ProtectedMoney } from '../../../@generic/component/protected-money/protected-money';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useRecurringCalendar } from '../../hook/use-recurring-calendar.hook';
import { RecurringCalendarEntryInterface } from '../../interface/recurring-calendar-entry.interface';
import { RecurringCalendarDayDetail } from '../recurring-calendar-day-detail/recurring-calendar-day-detail';
import { RecurringCalendarEmptyState } from '../recurring-calendar-empty-state/recurring-calendar-empty-state';
import { RecurringCalendarEntryList } from '../recurring-calendar-entry-list/recurring-calendar-entry-list';
import { RecurringCalendarGrid } from '../recurring-calendar-grid/recurring-calendar-grid';

import { RecurringCalendarSelector } from './recurring-calendar.selector';

const EMPTY_ENTRIES_BY_DAY: ReadonlyMap<number, readonly RecurringCalendarEntryInterface[]> = new Map();

// eslint-disable-next-line complexity, max-statements, max-lines-per-function -- Page orchestration component with multiple hooks, state, and forecast logic
export const RecurringCalendarContent = () => {
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);

    const now = new Date();
    const [displayMonth, setDisplayMonth] = useState(now.getMonth());
    const [displayYear, setDisplayYear] = useState(now.getFullYear());
    const { data } = useRecurringCalendar(displayYear, displayMonth);
    const [selectedDay, setSelectedDay] = useState<number | undefined>();
    const [displayedTotal, setDisplayedTotal] = useState(0);

    const entriesByDay = data?.entriesByDay ?? EMPTY_ENTRIES_BY_DAY;
    const forecastedEntriesByDay = data?.forecastedEntriesByDay ?? EMPTY_ENTRIES_BY_DAY;
    const totalAmount = data?.totalAmount ?? 0;
    const forecastedTotalAmount = data?.forecastedTotalAmount ?? 0;

    const isCurrentMonth = displayYear === now.getFullYear() && displayMonth === now.getMonth();
    const hasSelectedDay = isDefined(selectedDay);
    const isSelectedToday = isCurrentMonth && selectedDay === now.getDate();
    let selectedDayHeaderTestID = null;

    if (isSelectedToday) {
        selectedDayHeaderTestID = RecurringCalendarSelector.SelectedTodayHeader;
    } else if (hasSelectedDay) {
        selectedDayHeaderTestID = RecurringCalendarSelector.SelectedDayHeader(selectedDay);
    }

    const selectedEntries = isDefined(selectedDay)
        ? [...(entriesByDay.get(selectedDay) ?? []), ...(forecastedEntriesByDay.get(selectedDay) ?? [])]
        : [];
    const hasSelectedEntries = isNotEmptyArray(selectedEntries);

    const allForecastedEntries = [...forecastedEntriesByDay.values()].flat().sort((left, right) => left.dayOfMonth - right.dayOfMonth);
    const allActualEntries = [...entriesByDay.values()].flat().sort((left, right) => left.dayOfMonth - right.dayOfMonth);
    const showUpcomingList = !isDefined(selectedDay) && isCurrentMonth && isNotEmptyArray(allForecastedEntries);
    const showMonthlyList = !isDefined(selectedDay) && !isCurrentMonth && isNotEmptyArray(allActualEntries);

    const handleSelectDay = (day: number) => {
        setSelectedDay(current => (current === day ? undefined : day)); // eslint-disable-line no-undefined -- Toggle selection
    };

    const handleChangeMonth = (year: number, month: number) => {
        setDisplayYear(year);
        setDisplayMonth(month);
        setSelectedDay(undefined); // eslint-disable-line no-undefined -- Reset selection on month change
    };

    const hasEntries = isDefined(data) && (data.entriesByDay.size > 0 || data.forecastedEntriesByDay.size > 0);

    const selectedDayTotal = hasSelectedEntries ? selectedEntries.reduce((sum, entry) => sum + entry.latestAmount, 0) : 0;
    const formattedDayTotal = formatDigits(convertFromMicroUnits(selectedDayTotal), defaultInstrument.symbol);
    const formattedForecastedTotal = formatDigits(forecastedTotalAmount, defaultInstrument.symbol);
    const formattedTotalAmount = formatDigits(totalAmount, defaultInstrument.symbol);
    const headlineTotal = totalAmount + forecastedTotalAmount;

    useEffect(() => {
        if (isDefined(data)) {
            setDisplayedTotal(headlineTotal);
        }
    }, [data, headlineTotal]);

    if (isDefined(data) && !hasEntries) {
        return (
            <ScrollView contentContainerClassName="py-5xl" showsVerticalScrollIndicator={false}>
                <RecurringCalendarEmptyState />
            </ScrollView>
        );
    }

    return (
        <View className="flex-1" testID={RecurringCalendarSelector.Container}>
            <View className="gap-y-xl pt-md">
                <View className="items-center gap-y-lg">
                    <ProtectedMoney minFontSize={28} maxFontSize={28} instrumentSymbol={defaultInstrument.symbol}>
                        {displayedTotal}
                    </ProtectedMoney>
                    <Text className="font-medium text-xs uppercase text-secondary-foreground">
                        <Trans>Monthly Total</Trans>
                    </Text>
                </View>

                <RecurringCalendarGrid
                    entriesByDay={entriesByDay}
                    forecastedEntriesByDay={forecastedEntriesByDay}
                    selectedDay={selectedDay}
                    onSelectDay={handleSelectDay}
                    displayMonth={displayMonth}
                    displayYear={displayYear}
                    onChangeMonth={handleChangeMonth}
                />
            </View>

            {hasSelectedDay ? (
                <View className="flex-1 pt-lg">
                    <View className="bg-primary-reverse py-md -mx-5xl px-5xl flex-row justify-between items-center">
                        <Text
                            className="text-xs uppercase text-secondary-foreground"
                            {...(isDefined(selectedDayHeaderTestID) && { testID: selectedDayHeaderTestID })}
                        >
                            <Trans>Day {selectedDay}</Trans>
                        </Text>
                        <ProtectedText className="text-xs text-secondary-foreground">{formattedDayTotal}</ProtectedText>
                    </View>

                    <ScrollView className="flex-1" contentContainerClassName="pb-5xl" showsVerticalScrollIndicator={false}>
                        {hasSelectedEntries ? (
                            <RecurringCalendarDayDetail entries={selectedEntries} />
                        ) : (
                            <View className="items-center py-5xl px-5xl">
                                <Text
                                    className="text-secondary-foreground text-sm text-center"
                                    testID={RecurringCalendarSelector.SelectedDayEmptyState}
                                >
                                    <Trans>No recurring payments detected</Trans>
                                </Text>
                            </View>
                        )}
                        <MenuSpacer />
                    </ScrollView>
                </View>
            ) : null}

            {showUpcomingList ? (
                <RecurringCalendarEntryList
                    headerTestID={RecurringCalendarSelector.UpcomingHeader}
                    title={<Trans>Upcoming</Trans>}
                    formattedTotal={formattedForecastedTotal}
                    entries={allForecastedEntries}
                    displayMonth={displayMonth}
                    displayYear={displayYear}
                />
            ) : null}

            {showMonthlyList ? (
                <RecurringCalendarEntryList
                    headerTestID={RecurringCalendarSelector.AllRecurringHeader}
                    title={<Trans>All Recurring</Trans>}
                    formattedTotal={formattedTotalAmount}
                    entries={allActualEntries}
                    displayMonth={displayMonth}
                    displayYear={displayYear}
                />
            ) : null}
        </View>
    );
};
