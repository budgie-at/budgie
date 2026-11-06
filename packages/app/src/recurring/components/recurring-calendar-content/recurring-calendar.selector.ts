const normalizePart = (value: number | string) => String(value).replaceAll(/[^a-zA-Z0-9]+/gu, '_');

export const RecurringCalendarSelector = {
    Container: 'RecurringCalendar.Container',
    PreviousMonthButton: 'RecurringCalendar.PreviousMonthButton',
    NextMonthButton: 'RecurringCalendar.NextMonthButton',
    MonthLabel: 'RecurringCalendar.MonthLabel',
    CurrentMonthDay: (day: number) => `RecurringCalendar.Day.CurrentMonth.${day}` as const,
    SelectedDayHeader: (day: number) => `RecurringCalendar.SelectedDayHeader.${normalizePart(day)}` as const,
    SelectedDayEmptyState: 'RecurringCalendar.SelectedDayEmptyState',
    EmptyMonth: 'RecurringCalendar.EmptyMonth',
    RecordedHeader: 'RecurringCalendar.RecordedHeader',
    ExpectedHeader: 'RecurringCalendar.ExpectedHeader',
    Row: (title: string) => `RecurringCalendar.Row.${normalizePart(title)}` as const
} as const;
