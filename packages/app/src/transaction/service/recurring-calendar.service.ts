import { MonthlyPatternRawRowInterface, TransactionTypeEnum } from '@budgie/contracts';
import { getDaysInMonth } from 'date-fns';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { transactionPatternRepository } from '../../@generic/drizzle/db/db';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { RecurringCalendarDataInterface } from '../interface/recurring-calendar-data.interface';
import { RecurringCalendarEntryInterface } from '../interface/recurring-calendar-entry.interface';

const MINUTES_TO_SECONDS = -60;

class RecurringCalendarService {
    async getMonthlyRecurringPayments(
        defaultInstrumentId: number,
        displayYear: number,
        displayMonth: number
    ): Promise<RecurringCalendarDataInterface> {
        const timezoneOffsetSeconds = new Date().getTimezoneOffset() * MINUTES_TO_SECONDS;
        const monthDate = new Date(displayYear, displayMonth);
        const daysInMonth = getDaysInMonth(monthDate);
        const displayMonthString = `${displayYear}-${String(displayMonth + 1).padStart(2, '0')}`;

        const patterns = await transactionPatternRepository.findMonthlyRecurringPatterns({
            type: TransactionTypeEnum.EXPENSE,
            defaultInstrumentId,
            timezoneOffsetSeconds,
            displayMonth: displayMonthString
        });

        const now = new Date();
        const isCurrentMonth = displayYear === now.getFullYear() && displayMonth === now.getMonth();
        const today = now.getDate();

        return this.buildCalendarData(patterns, isCurrentMonth, today, daysInMonth);
    }

    // eslint-disable-next-line max-statements -- Splits patterns into actual and forecasted entries with separate maps
    private buildCalendarData(
        patterns: readonly MonthlyPatternRawRowInterface[],
        isCurrentMonth: boolean,
        today: number,
        daysInMonth: number
    ): RecurringCalendarDataInterface {
        const entriesByDay = new Map<number, RecurringCalendarEntryInterface[]>();
        const forecastedEntriesByDay = new Map<number, RecurringCalendarEntryInterface[]>();
        let totalAmount = 0;
        let forecastedTotalAmount = 0;

        for (const pattern of patterns) {
            const hasDisplayMonthTransaction =
                isPositiveNumber(pattern.dayOfMonth) && isPositiveNumber(pattern.latestTransactionId) && isDefined(pattern.title);

            if (hasDisplayMonthTransaction) {
                const entry = this.buildEntryFromPattern(pattern, {
                    dayOfMonth: pattern.dayOfMonth,
                    title: pattern.title,
                    latestTransactionId: pattern.latestTransactionId,
                    isForecast: false
                });
                this.addEntryToMap(entriesByDay, pattern.dayOfMonth, entry);
                totalAmount += pattern.latestAmount;
            } else if (isPositiveNumber(pattern.modeDayOfMonth) && isDefined(pattern.latestOverallTitle)) {
                const clampedDay = Math.min(pattern.modeDayOfMonth, daysInMonth);
                const isForecastedUpcoming = isCurrentMonth && clampedDay > today;

                if (isForecastedUpcoming) {
                    const entry = this.buildEntryFromPattern(pattern, {
                        dayOfMonth: clampedDay,
                        title: pattern.latestOverallTitle,
                        latestTransactionId: null,
                        isForecast: true
                    });
                    this.addEntryToMap(forecastedEntriesByDay, clampedDay, entry);
                    forecastedTotalAmount += pattern.latestAmount;
                } else {
                    const entry = this.buildEntryFromPattern(pattern, {
                        dayOfMonth: clampedDay,
                        title: pattern.latestOverallTitle,
                        latestTransactionId: null,
                        isForecast: false
                    });
                    this.addEntryToMap(entriesByDay, clampedDay, entry);
                    totalAmount += pattern.latestAmount;
                }
            }
        }

        return {
            entriesByDay,
            forecastedEntriesByDay,
            totalAmount: convertFromMicroUnits(totalAmount),
            forecastedTotalAmount: convertFromMicroUnits(forecastedTotalAmount)
        };
    }

    private buildEntryFromPattern(
        pattern: MonthlyPatternRawRowInterface,
        overrides: Pick<RecurringCalendarEntryInterface, 'dayOfMonth' | 'title' | 'latestTransactionId' | 'isForecast'>
    ): RecurringCalendarEntryInterface {
        return {
            categoryId: pattern.categoryId,
            categoryTitle: pattern.categoryTitle,
            categoryIcon: pattern.categoryIcon,
            latestAmount: pattern.latestAmount,
            occurrenceCount: pattern.occurrenceCount,
            accountId: pattern.accountId,
            instrumentId: pattern.instrumentId,
            ...overrides
        };
    }

    private addEntryToMap(map: Map<number, RecurringCalendarEntryInterface[]>, day: number, entry: RecurringCalendarEntryInterface): void {
        const existing = map.get(day) ?? [];
        existing.push(entry);
        map.set(day, existing);
    }
}

export const recurringCalendarService = new RecurringCalendarService();
