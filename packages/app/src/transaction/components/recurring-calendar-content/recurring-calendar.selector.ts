const normalizePart = (value: number | string) => String(value).replace(/[^a-zA-Z0-9]+/gu, '_');

export const RecurringCalendarSelector = {
    Container: 'RecurringCalendar.Container',
    PreviousMonthButton: 'RecurringCalendar.PreviousMonthButton',
    NextMonthButton: 'RecurringCalendar.NextMonthButton',
    MonthLabel: 'RecurringCalendar.MonthLabel',
    Today: 'RecurringCalendar.Day.Today',
    CurrentMonthDay: (day: number) => `RecurringCalendar.Day.CurrentMonth.${day}` as const,
    SelectedTodayHeader: 'RecurringCalendar.SelectedDayHeader.Today',
    SelectedDayHeader: (day: number) => `RecurringCalendar.SelectedDayHeader.${normalizePart(day)}` as const,
    UpcomingHeader: 'RecurringCalendar.UpcomingHeader',
    AllRecurringHeader: 'RecurringCalendar.AllRecurringHeader',
    Row: (title: string) => `RecurringCalendar.Row.${normalizePart(title)}` as const
} as const;
