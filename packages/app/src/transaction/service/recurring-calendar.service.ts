import { MonthlyPatternRowInterface, TransactionTypeEnum } from '@budgie/contracts';

import { transactionPatternRepository } from '../../@generic/drizzle/db/db';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { RecurringCalendarDataInterface } from '../interface/recurring-calendar-data.interface';
import { RecurringCalendarEntryInterface } from '../interface/recurring-calendar-entry.interface';

class RecurringCalendarService {
    async getMonthlyRecurringPayments(defaultInstrumentId: number): Promise<RecurringCalendarDataInterface> {
        const patterns = await transactionPatternRepository.findMonthlyRecurringPatterns({
            type: TransactionTypeEnum.EXPENSE,
            defaultInstrumentId
        });

        return this.buildCalendarData(patterns);
    }

    private buildCalendarData(patterns: readonly MonthlyPatternRowInterface[]): RecurringCalendarDataInterface {
        const entriesByDay = new Map<number, RecurringCalendarEntryInterface[]>();
        let totalAmount = 0;

        for (const pattern of patterns) {
            const entry: RecurringCalendarEntryInterface = {
                categoryId: pattern.categoryId,
                categoryTitle: pattern.categoryTitle,
                categoryIcon: pattern.categoryIcon,
                title: pattern.title,
                latestAmount: pattern.latestAmount,
                occurrenceCount: pattern.occurrenceCount,
                dayOfMonth: pattern.dayOfMonth,
                accountId: pattern.accountId,
                instrumentId: pattern.instrumentId
            };

            const existing = entriesByDay.get(pattern.dayOfMonth) ?? [];
            existing.push(entry);
            entriesByDay.set(pattern.dayOfMonth, existing);

            totalAmount += pattern.latestAmount;
        }

        return {
            entriesByDay,
            totalAmount: convertFromMicroUnits(totalAmount)
        };
    }
}

export const recurringCalendarService = new RecurringCalendarService();
