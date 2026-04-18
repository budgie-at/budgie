import { MonthlyPatternRawRowInterface, TransactionTypeEnum } from '@budgie/contracts';
import { getDaysInMonth } from 'date-fns';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { transactionPatternRepository } from '../../@generic/drizzle/db/db';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { RecurringCalendarAccumulatorInterface } from '../interface/recurring-calendar-accumulator.interface';
import { RecurringCalendarDataInterface } from '../interface/recurring-calendar-data.interface';
import { RecurringCalendarEntryInterface } from '../interface/recurring-calendar-entry.interface';

import { patternCacheService } from './pattern-cache/pattern-cache.service';

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

        const monthlyQuery = {
            type: TransactionTypeEnum.EXPENSE,
            defaultInstrumentId,
            timezoneOffsetSeconds,
            displayMonth: displayMonthString
        };
        const cacheKey = `monthly:${JSON.stringify(monthlyQuery)}`;
        const patterns = await patternCacheService.memoizeMonthly(cacheKey, () =>
            transactionPatternRepository.findMonthlyRecurringPatterns(monthlyQuery)
        );

        const now = new Date();
        const isCurrentMonth = displayYear === now.getFullYear() && displayMonth === now.getMonth();
        const today = now.getDate();

        return this.buildCalendarData(patterns, isCurrentMonth, today, daysInMonth);
    }

    private buildCalendarData(
        patterns: readonly MonthlyPatternRawRowInterface[],
        isCurrentMonth: boolean,
        today: number,
        daysInMonth: number
    ): RecurringCalendarDataInterface {
        const accumulator: RecurringCalendarAccumulatorInterface = {
            entriesByDay: new Map(),
            forecastedEntriesByDay: new Map(),
            isCurrentMonth,
            today,
            daysInMonth,
            totalAmount: 0,
            forecastedTotalAmount: 0
        };

        for (const pattern of patterns) {
            this.processPattern(pattern, accumulator);
        }

        return {
            entriesByDay: accumulator.entriesByDay,
            forecastedEntriesByDay: accumulator.forecastedEntriesByDay,
            totalAmount: convertFromMicroUnits(accumulator.totalAmount),
            forecastedTotalAmount: convertFromMicroUnits(accumulator.forecastedTotalAmount)
        };
    }

    private processPattern(pattern: MonthlyPatternRawRowInterface, accumulator: RecurringCalendarAccumulatorInterface): void {
        const hasDisplayMonthTransaction =
            isPositiveNumber(pattern.dayOfMonth) && isPositiveNumber(pattern.latestTransactionId) && isDefined(pattern.title);

        if (hasDisplayMonthTransaction) {
            const entry = this.buildEntryFromPattern(pattern, {
                dayOfMonth: pattern.dayOfMonth,
                title: pattern.title,
                latestTransactionId: pattern.latestTransactionId,
                isForecast: false
            });
            this.addEntryToMap(accumulator.entriesByDay, pattern.dayOfMonth, entry);
            accumulator.totalAmount += pattern.latestAmount;
        } else if (isPositiveNumber(pattern.modeDayOfMonth) && isDefined(pattern.latestOverallTitle)) {
            this.processForecastPattern(pattern, accumulator, pattern.modeDayOfMonth, pattern.latestOverallTitle);
        }
    }

    private processForecastPattern(
        pattern: MonthlyPatternRawRowInterface,
        accumulator: RecurringCalendarAccumulatorInterface,
        modeDayOfMonth: number,
        latestOverallTitle: string
    ): void {
        const clampedDay = Math.min(modeDayOfMonth, accumulator.daysInMonth);
        const isForecastedUpcoming = accumulator.isCurrentMonth && clampedDay > accumulator.today;

        if (isForecastedUpcoming) {
            const entry = this.buildEntryFromPattern(pattern, {
                dayOfMonth: clampedDay,
                title: latestOverallTitle,
                latestTransactionId: null,
                isForecast: true
            });
            this.addEntryToMap(accumulator.forecastedEntriesByDay, clampedDay, entry);
            accumulator.forecastedTotalAmount += pattern.latestAmount;
        }
    }

    private buildEntryFromPattern(
        pattern: MonthlyPatternRawRowInterface,
        overrides: Pick<RecurringCalendarEntryInterface, 'dayOfMonth' | 'title' | 'latestTransactionId' | 'isForecast'>
    ): RecurringCalendarEntryInterface {
        return {
            categoryId: pattern.categoryId,
            categoryTitle: pattern.categoryTitle ?? pattern.mccCategoryTitle,
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
