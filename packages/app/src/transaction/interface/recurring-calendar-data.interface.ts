import { RecurringCalendarEntryInterface } from './recurring-calendar-entry.interface';

export interface RecurringCalendarDataInterface {
    readonly entriesByDay: ReadonlyMap<number, readonly RecurringCalendarEntryInterface[]>;
    readonly totalAmount: number;
}
