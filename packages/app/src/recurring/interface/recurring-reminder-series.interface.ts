export interface RecurringReminderSeriesInterface {
    readonly id: number;
    readonly nextDate: Date | null;
    readonly reminderDaysBefore: number | null;
}
