import { convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { Trans, useLingui } from '@lingui/react/macro';
import { useReducer } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { MenuSpacer } from '../../../@generic/component/menu-spacer/menu-spacer';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useToday } from '../../../@generic/hook/use-today.hook';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useLocaleInfo } from '../../../i18n/hook/use-locale-info.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { RecurringCalendarActionTypeEnum } from '../../enum/recurring-calendar-action-type.enum';
import { useRecurringCalendar } from '../../hook/use-recurring-calendar.hook';
import { recurringCalendarReducer } from '../../utils/recurring-calendar-reducer.util';
import { RecurringCalendarEmptyState } from '../recurring-calendar-empty-state/recurring-calendar-empty-state';
import { RecurringCalendarEntryList } from '../recurring-calendar-entry-list/recurring-calendar-entry-list';
import { RecurringCalendarGrid } from '../recurring-calendar-grid/recurring-calendar-grid';

import { RecurringCalendarSelector } from './recurring-calendar.selector';

import type { RecurringCalendarEntryInterface } from '@budgie/recurring';

const scrollContentStyle = { paddingBottom: 20, rowGap: 12 };

const EMPTY_ENTRIES_BY_DAY: ReadonlyMap<number, readonly RecurringCalendarEntryInterface[]> = new Map();

// eslint-disable-next-line max-statements, max-lines-per-function -- Page orchestration component with multiple hooks, state, and forecast logic
export const RecurringCalendarContent = () => {
    const { t } = useLingui();
    const { languageTag } = useLocaleInfo();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const formatDigits = useDisplayFormatDigits();

    const now = useToday();
    const [{ displayMonth, displayYear, selectedDay }, dispatch] = useReducer(recurringCalendarReducer, {
        displayMonth: now.getMonth(),
        displayYear: now.getFullYear()
    });
    const data = useRecurringCalendar(displayYear, displayMonth);
    const isLoading = !isDefined(data);

    const entriesByDay = data?.entriesByDay ?? EMPTY_ENTRIES_BY_DAY;
    const forecastedEntriesByDay = data?.forecastedEntriesByDay ?? EMPTY_ENTRIES_BY_DAY;
    const totalAmount = data?.totalAmount ?? 0;
    const forecastedTotalAmount = data?.forecastedTotalAmount ?? 0;

    const hasSelectedDay = isDefined(selectedDay);

    const selectedEntries = isDefined(selectedDay)
        ? [...(entriesByDay.get(selectedDay) ?? []), ...(forecastedEntriesByDay.get(selectedDay) ?? [])]
        : [];

    const allRecordedEntries = [...entriesByDay.values()].flat().sort((left, right) => left.dayOfMonth - right.dayOfMonth);
    const allForecastedEntries = [...forecastedEntriesByDay.values()].flat().sort((left, right) => left.dayOfMonth - right.dayOfMonth);
    const showExpectedList = !hasSelectedDay && isNotEmptyArray(allForecastedEntries);
    const showRecordedList = !hasSelectedDay && isNotEmptyArray(allRecordedEntries);

    const handleSelectDay = (day: number) => {
        dispatch({ type: RecurringCalendarActionTypeEnum.DAY_TOGGLED, day });
    };

    const handleChangeMonth = (year: number, month: number) => {
        dispatch({ type: RecurringCalendarActionTypeEnum.MONTH_CHANGED, year, month });
    };

    const hasEntries = isDefined(data) && (data.entriesByDay.size > 0 || data.forecastedEntriesByDay.size > 0);

    const formattedDayExpense = formatDigits(
        convertFromMicroUnits(selectedEntries.reduce((total, entry) => total + entry.latestAmount, 0)),
        defaultInstrument.symbol
    );
    const displayMonthLabel = new Intl.DateTimeFormat(languageTag, { month: 'long' }).format(new Date(displayYear, displayMonth, 1));
    const hasDetectedPayments = isPositiveNumber(data?.committedMonthlyExpense);
    const selectedDayTotal = isNotEmptyArray(selectedEntries) ? formattedDayExpense : '';
    const formattedForecastedTotal = formatDigits(forecastedTotalAmount, defaultInstrument.symbol);
    const displayedTotal = isDefined(data) ? totalAmount + forecastedTotalAmount : 0;

    return (
        <KeyboardAwareScrollView
            testID={RecurringCalendarSelector.Container}
            contentContainerStyle={scrollContentStyle}
            bottomOffset={40}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
        >
            <View className="gap-y-md pt-xl">
                <View className="items-center gap-y-xs">
                    <LoadingContent
                        isLoading={isLoading}
                        containerClassName="self-stretch"
                        loadingIndicator={
                            <ActivityIndicator size="small" colorClassName="accent-primary" style={StyleSheet.absoluteFill} />
                        }
                    >
                        <ProtectedText
                            className="text-[32px] font-semibold text-primary text-center tabular-nums self-stretch"
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.5}
                            maxFontSizeMultiplier={1.5}
                        >
                            {formatDigits(displayedTotal, defaultInstrument.symbol)}
                        </ProtectedText>
                    </LoadingContent>
                    <Text maxFontSizeMultiplier={1.5} className="font-medium text-xs text-secondary-foreground">
                        <Trans>Monthly total</Trans>
                    </Text>
                </View>

                <RecurringCalendarGrid
                    isLoading={isLoading}
                    entriesByDay={entriesByDay}
                    forecastedEntriesByDay={forecastedEntriesByDay}
                    selectedDay={selectedDay}
                    onSelectDay={handleSelectDay}
                    displayMonth={displayMonth}
                    displayYear={displayYear}
                    onChangeMonth={handleChangeMonth}
                />
            </View>

            <LoadingContent isLoading={isLoading} className="gap-y-5xl" loadingIndicator={null}>
                {hasSelectedDay ? (
                    <RecurringCalendarEntryList
                        headerTestID={RecurringCalendarSelector.SelectedDayHeader(selectedDay)}
                        title={new Intl.DateTimeFormat(languageTag, { weekday: 'short', month: 'short', day: 'numeric' }).format(
                            new Date(displayYear, displayMonth, selectedDay)
                        )}
                        formattedTotal={selectedDayTotal}
                        entries={selectedEntries}
                        emptyContent={
                            <RecurringCalendarEmptyState
                                title={t`No recurring payments on this day`}
                                testID={RecurringCalendarSelector.SelectedDayEmptyState}
                            />
                        }
                    />
                ) : null}

                {showExpectedList ? (
                    <RecurringCalendarEntryList
                        headerTestID={RecurringCalendarSelector.ExpectedHeader}
                        title={<Trans>Expected</Trans>}
                        formattedTotal={formattedForecastedTotal}
                        entries={allForecastedEntries}
                        displayMonth={displayMonth}
                        displayYear={displayYear}
                    />
                ) : null}

                {showRecordedList ? (
                    <RecurringCalendarEntryList
                        headerTestID={RecurringCalendarSelector.RecordedHeader}
                        title={<Trans>Recorded</Trans>}
                        formattedTotal={formatDigits(totalAmount, defaultInstrument.symbol)}
                        entries={allRecordedEntries}
                        displayMonth={displayMonth}
                        displayYear={displayYear}
                    />
                ) : null}

                {!hasEntries && !hasSelectedDay ? (
                    <RecurringCalendarEmptyState title={t`No recurring payments in ${displayMonthLabel}`}>
                        {hasDetectedPayments ? (
                            <Trans>View your payments in another month.</Trans>
                        ) : (
                            <Trans>Recurring payments are detected automatically from your transactions.</Trans>
                        )}
                    </RecurringCalendarEmptyState>
                ) : null}
            </LoadingContent>
            <MenuSpacer />
        </KeyboardAwareScrollView>
    );
};
