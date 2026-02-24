import { Trans, useLingui } from '@lingui/react/macro';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { MenuSpacer } from '../../../@generic/component/menu-spacer/menu-spacer';
import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { ProtectedMoney } from '../../../@generic/component/protected-money/protected-money';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useRecurringCalendar } from '../../hook/use-recurring-calendar.hook';
import { RecurringCalendarEntryInterface } from '../../interface/recurring-calendar-entry.interface';
import { RecurringCalendarDayDetail } from '../recurring-calendar-day-detail/recurring-calendar-day-detail';
import { RecurringCalendarEmptyState } from '../recurring-calendar-empty-state/recurring-calendar-empty-state';
import { RecurringCalendarGrid } from '../recurring-calendar-grid/recurring-calendar-grid';
import { RecurringCalendarUpcoming } from '../recurring-calendar-upcoming/recurring-calendar-upcoming';

const EMPTY_ENTRIES_BY_DAY: ReadonlyMap<number, readonly RecurringCalendarEntryInterface[]> = new Map();

// eslint-disable-next-line max-statements, max-lines-per-function -- Page orchestration component with multiple hooks, state, and forecast logic
export const RecurringCalendarPage = () => {
    const { t } = useLingui();
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);

    const now = new Date();
    const [displayMonth, setDisplayMonth] = useState(now.getMonth());
    const [displayYear, setDisplayYear] = useState(now.getFullYear());
    const { data, isLoading } = useRecurringCalendar(displayYear, displayMonth);
    const [selectedDay, setSelectedDay] = useState<number | undefined>();

    const entriesByDay = data?.entriesByDay ?? EMPTY_ENTRIES_BY_DAY;
    const forecastedEntriesByDay = data?.forecastedEntriesByDay ?? EMPTY_ENTRIES_BY_DAY;
    const totalAmount = data?.totalAmount ?? 0;
    const forecastedTotalAmount = data?.forecastedTotalAmount ?? 0;

    const isCurrentMonth = displayYear === now.getFullYear() && displayMonth === now.getMonth();

    const selectedEntries = useMemo(() => {
        if (!isDefined(selectedDay)) {
            return [];
        }
        const actual = entriesByDay.get(selectedDay) ?? [];
        const forecasted = forecastedEntriesByDay.get(selectedDay) ?? [];

        return [...actual, ...forecasted];
    }, [selectedDay, entriesByDay, forecastedEntriesByDay]);
    const hasSelectedEntries = isNotEmptyArray(selectedEntries);

    const allForecastedEntries = useMemo(() => {
        const entries: RecurringCalendarEntryInterface[] = [];
        for (const dayEntries of forecastedEntriesByDay.values()) {
            entries.push(...dayEntries);
        }

        return entries.sort((left, right) => left.dayOfMonth - right.dayOfMonth);
    }, [forecastedEntriesByDay]);
    const showUpcomingList = !isDefined(selectedDay) && isCurrentMonth && isNotEmptyArray(allForecastedEntries);

    const handleSelectDay = (day: number) => {
        setSelectedDay(current => (current === day ? undefined : day)); // eslint-disable-line no-undefined -- Toggle selection
    };

    const handleChangeMonth = (year: number, month: number) => {
        setDisplayYear(year);
        setDisplayMonth(month);
        setSelectedDay(undefined); // eslint-disable-line no-undefined -- Reset selection on month change
    };

    if (isLoading) {
        return (
            <Page header={<PageHeader className="border-b-0" title={t`Recurring`} />}>
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator />
                </View>
            </Page>
        );
    }

    const hasEntries = isDefined(data) && (data.entriesByDay.size > 0 || data.forecastedEntriesByDay.size > 0);

    const selectedDayTotal = hasSelectedEntries ? selectedEntries.reduce((sum, entry) => sum + entry.latestAmount, 0) : 0;
    const formattedDayTotal = formatDigits(convertFromMicroUnits(selectedDayTotal), defaultInstrument.symbol);
    const formattedForecastedTotal = formatDigits(forecastedTotalAmount, defaultInstrument.symbol);

    return (
        <Page header={<PageHeader className="border-b-0" title={t`Recurring`} />}>
            {hasEntries ? (
                <View className="flex-1">
                    <View className="gap-y-xl pt-md">
                        <View className="items-center gap-y-lg">
                            <ProtectedMoney
                                minFontSize={10}
                                maxFontSize={32}
                                decimalPlaces={decimalPlaces}
                                instrumentSymbol={defaultInstrument.symbol}
                            >
                                {totalAmount}
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

                    {hasSelectedEntries && isDefined(selectedDay) ? (
                        <View className="flex-1 pt-lg">
                            <View className="bg-primary-reverse py-md -mx-5xl px-5xl flex-row justify-between items-center">
                                <Text className="text-xs uppercase text-secondary-foreground">
                                    <Trans>Day {selectedDay}</Trans>
                                </Text>
                                <ProtectedText className="text-xs text-secondary-foreground">{formattedDayTotal}</ProtectedText>
                            </View>

                            <ScrollView className="flex-1" contentContainerClassName="pb-5xl" showsVerticalScrollIndicator={false}>
                                <RecurringCalendarDayDetail entries={selectedEntries} />
                                <MenuSpacer />
                            </ScrollView>
                        </View>
                    ) : null}

                    {showUpcomingList ? (
                        <View className="flex-1 pt-lg">
                            <ScrollView className="flex-1" contentContainerClassName="pb-5xl" showsVerticalScrollIndicator={false}>
                                <RecurringCalendarUpcoming entries={allForecastedEntries} totalAmount={formattedForecastedTotal} />
                                <MenuSpacer />
                            </ScrollView>
                        </View>
                    ) : null}
                </View>
            ) : (
                <ScrollView contentContainerClassName="py-5xl" showsVerticalScrollIndicator={false}>
                    <RecurringCalendarEmptyState />
                </ScrollView>
            )}
        </Page>
    );
};
