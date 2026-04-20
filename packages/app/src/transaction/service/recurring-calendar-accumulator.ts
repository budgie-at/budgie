import type { RecurringCalendarAccumulatorParamsInterface } from '../interface/recurring-calendar-accumulator-params.interface';
import type { RecurringCalendarEntryInterface } from '../interface/recurring-calendar-entry.interface';

export class RecurringCalendarAccumulator {
    readonly entriesByDay: Map<number, RecurringCalendarEntryInterface[]>;
    readonly forecastedEntriesByDay: Map<number, RecurringCalendarEntryInterface[]>;
    readonly isCurrentMonth: boolean;
    readonly today: number;
    readonly daysInMonth: number;

    private totalAmountValue = 0;
    private forecastedTotalAmountValue = 0;

    constructor(params: RecurringCalendarAccumulatorParamsInterface) {
        this.entriesByDay = params.entriesByDay;
        this.forecastedEntriesByDay = params.forecastedEntriesByDay;
        this.isCurrentMonth = params.isCurrentMonth;
        this.today = params.today;
        this.daysInMonth = params.daysInMonth;
    }

    get totalAmount(): number {
        return this.totalAmountValue;
    }

    get forecastedTotalAmount(): number {
        return this.forecastedTotalAmountValue;
    }

    addTotal(amount: number): void {
        this.totalAmountValue += amount;
    }

    addForecastedTotal(amount: number): void {
        this.forecastedTotalAmountValue += amount;
    }
}
