import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { RecurringCalendarDataInterface } from '../interface/recurring-calendar-data.interface';
import { RecurringCalendarEntryInterface } from '../interface/recurring-calendar-entry.interface';
import { RecurringSeriesEventInterface } from '../interface/recurring-series-event.interface';
import { RecurringSeriesInterface } from '../interface/recurring-series.interface';

export class RecurringCalendarAccumulator {
    private readonly entriesByDay = new Map<number, RecurringCalendarEntryInterface[]>();
    private readonly forecastedEntriesByDay = new Map<number, RecurringCalendarEntryInterface[]>();
    private totalAmount = 0;
    private forecastedTotalAmount = 0;

    addActual(series: RecurringSeriesInterface, event: RecurringSeriesEventInterface): void {
        const entry = this.buildEntry(series, {
            day: event.day,
            amount: event.amount,
            latestTransactionId: event.transactionId,
            isForecast: false
        });
        this.addEntry(this.entriesByDay, event.day, entry);
        this.totalAmount += event.amount;
    }

    addForecast(series: RecurringSeriesInterface, day: number): void {
        const entry = this.buildEntry(series, {
            day,
            amount: series.predictedAmount,
            latestTransactionId: null,
            isForecast: true
        });
        this.addEntry(this.forecastedEntriesByDay, day, entry);
        this.forecastedTotalAmount += series.predictedAmount;
    }

    build(): RecurringCalendarDataInterface {
        return {
            entriesByDay: this.entriesByDay,
            forecastedEntriesByDay: this.forecastedEntriesByDay,
            totalAmount: convertFromMicroUnits(this.totalAmount),
            forecastedTotalAmount: convertFromMicroUnits(this.forecastedTotalAmount)
        };
    }

    private addEntry(map: Map<number, RecurringCalendarEntryInterface[]>, day: number, entry: RecurringCalendarEntryInterface): void {
        const existing = map.get(day) ?? [];
        existing.push(entry);
        map.set(day, existing);
    }

    private buildEntry(
        series: RecurringSeriesInterface,
        entry: {
            readonly day: number;
            readonly amount: number;
            readonly latestTransactionId: number | null;
            readonly isForecast: boolean;
        }
    ): RecurringCalendarEntryInterface {
        return {
            categoryId: series.categoryId,
            categoryTitle: series.categoryTitle,
            categoryIcon: series.categoryIcon,
            title: series.title,
            latestAmount: entry.amount,
            latestTransactionId: entry.latestTransactionId,
            dayOfMonth: entry.day,
            accountId: series.accountId,
            isForecast: entry.isForecast
        };
    }
}
