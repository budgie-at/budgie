import type { RecurringCalendarDayInterface } from '../interface/recurring-calendar-day.interface';

export const buildRecurringCalendarDays = (
    year: number,
    month: number,
    selectedDay: number | undefined,
    today: Date
): readonly RecurringCalendarDayInterface[] => {
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return Array.from({ length: firstWeekday + daysInMonth > 35 ? 42 : 35 }, (_, index) => {
        const date = new Date(year, month, index - firstWeekday + 1, 12);
        const isCurrentMonth = date.getFullYear() === year && date.getMonth() === month;

        return {
            date,
            number: date.getDate(),
            isCurrentMonth,
            isSelected: isCurrentMonth && date.getDate() === selectedDay,
            isToday:
                date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate(),
            isDisabled: !isCurrentMonth
        };
    });
};
