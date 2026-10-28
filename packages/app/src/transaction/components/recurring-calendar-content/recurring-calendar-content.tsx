import { convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { Trans, useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { ProtectedMoney } from '../../../@generic/component/protected-money/protected-money';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useToday } from '../../../@generic/hook/use-today.hook';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useRecurringCalendar } from '../../hook/use-recurring-calendar.hook';
import { RecurringCalendarEmptyState } from '../recurring-calendar-empty-state/recurring-calendar-empty-state';
import { RecurringCalendarEntryList } from '../recurring-calendar-entry-list/recurring-calendar-entry-list';
import { RecurringCalendarGrid } from '../recurring-calendar-grid/recurring-calendar-grid';

import { RecurringCalendarSelector } from './recurring-calendar.selector';

import type { RecurringCalendarEntryInterface } from '@budgie/recurring';

const EMPTY_ENTRIES_BY_DAY: ReadonlyMap<number, readonly RecurringCalendarEntryInterface[]> = new Map();

// eslint-disable-next-line complexity, max-statements, max-lines-per-function -- Page orchestration component with multiple hooks, state, and forecast logic
export const RecurringCalendarContent = () => {
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const formatDigits = useDisplayFormatDigits();

    const now = useToday();
    const [displayMonth, setDisplayMonth] = useState(now.getMonth());
    const [displayYear, setDisplayYear] = useState(now.getFullYear());
    const data = useRecurringCalendar(displayYear, displayMonth);
    const [selectedDay, setSelectedDay] = useState<number | undefined>();

    const entriesByDay = data?.entriesByDay ?? EMPTY_ENTRIES_BY_DAY;
    const forecastedEntriesByDay = data?.forecastedEntriesByDay ?? EMPTY_ENTRIES_BY_DAY;
    const totalAmount = data?.totalAmount ?? 0;
    const forecastedTotalAmount = data?.forecastedTotalAmount ?? 0;

    const isCurrentMonth = displayYear === now.getFullYear() && displayMonth === now.getMonth();
    const hasSelectedDay = isDefined(selectedDay);

    const selectedEntries = isDefined(selectedDay)
        ? [...(entriesByDay.get(selectedDay) ?? []), ...(forecastedEntriesByDay.get(selectedDay) ?? [])]
        : [];

    const allForecastedEntries = [...forecastedEntriesByDay.values()].flat().sort((left, right) => left.dayOfMonth - right.dayOfMonth);
    const allMonthlyEntries = [...entriesByDay.values(), ...forecastedEntriesByDay.values()]
        .flat()
        .sort((left, right) => left.dayOfMonth - right.dayOfMonth);
    const showUpcomingList = !isDefined(selectedDay) && isCurrentMonth && isNotEmptyArray(allForecastedEntries);
    const showMonthlyList = !isDefined(selectedDay) && !isCurrentMonth && isNotEmptyArray(allMonthlyEntries);

    const handleSelectDay = (day: number) => {
        setSelectedDay(current => (current === day ? undefined : day)); // eslint-disable-line no-undefined -- Toggle selection
    };

    const handleChangeMonth = (year: number, month: number) => {
        setDisplayYear(year);
        setDisplayMonth(month);
        setSelectedDay(undefined); // eslint-disable-line no-undefined -- Reset selection on month change
    };

    const hasEntries = isDefined(data) && (data.entriesByDay.size > 0 || data.forecastedEntriesByDay.size > 0);

    const formattedDayExpense = formatDigits(
        convertFromMicroUnits(selectedEntries.reduce((total, entry) => total + entry.latestAmount, 0)),
        defaultInstrument.symbol
    );
    const formattedForecastedTotal = formatDigits(forecastedTotalAmount, defaultInstrument.symbol);
    const displayedTotal = isDefined(data) ? totalAmount + forecastedTotalAmount : 0;
    const committedExpense = formatDigits(data?.committedMonthlyExpense ?? 0, defaultInstrument.symbol);

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
                    <ProtectedMoney fontSize={28} minFontSize={28} maxFontSize={28} instrumentSymbol={defaultInstrument.symbol}>
                        {displayedTotal}
                    </ProtectedMoney>
                    <Text className="font-medium text-xs uppercase text-secondary-foreground">
                        <Trans>Monthly Total</Trans>
                    </Text>
                    <ProtectedText className="text-xs text-secondary-foreground">
                        {t`Committed ${committedExpense} per month`}
                    </ProtectedText>
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
                <RecurringCalendarEntryList
                    headerTestID={RecurringCalendarSelector.SelectedDayHeader(selectedDay)}
                    title={<Trans>Day {selectedDay}</Trans>}
                    formattedTotal={formattedDayExpense}
                    entries={selectedEntries}
                    emptyContent={
                        <View className="items-center py-5xl px-5xl">
                            <Text
                                className="text-secondary-foreground text-sm text-center"
                                testID={RecurringCalendarSelector.SelectedDayEmptyState}
                            >
                                <Trans>No recurring payments detected</Trans>
                            </Text>
                        </View>
                    }
                />
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
                    formattedTotal={formatDigits(displayedTotal, defaultInstrument.symbol)}
                    entries={allMonthlyEntries}
                    displayMonth={displayMonth}
                    displayYear={displayYear}
                />
            ) : null}
        </View>
    );
};
