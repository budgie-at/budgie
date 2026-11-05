export interface RecurringCalendarDayInterface {
    readonly date: Date;
    readonly number: number;
    readonly isCurrentMonth: boolean;
    readonly isSelected: boolean;
    readonly isToday: boolean;
    readonly isDisabled: boolean;
}
