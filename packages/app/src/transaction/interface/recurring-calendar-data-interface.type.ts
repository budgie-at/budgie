import { RecurringCalendarEntryInterface } from './recurring-calendar-entry-interface.type';

export interface RecurringCalendarDataInterface {
    readonly entriesByDay: ReadonlyMap<number, readonly RecurringCalendarEntryInterface[]>;
    readonly forecastedEntriesByDay: ReadonlyMap<number, readonly RecurringCalendarEntryInterface[]>;
    readonly totalAmount: number;
    readonly forecastedTotalAmount: number;
}
