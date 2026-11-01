export const formatBudgetFundDueDate = (
    dueAt: Date,
    today: Date,
    formatMonthAndDay: (date: Date) => string,
    formatDayAndMonthAndYear: (date: Date) => string
): string => (dueAt.getFullYear() === today.getFullYear() ? formatMonthAndDay(dueAt) : formatDayAndMonthAndYear(dueAt));
