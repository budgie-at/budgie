export interface RecurringReminderPlanInterface {
    readonly seriesId: number;
    readonly scheduledAt: Date;
    readonly daysUntilDue: number;
}
