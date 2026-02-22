import { CalendarDayDataInterface } from '../interface/calendar-day-data.interface';

const DAYS_IN_WEEK = 7;

export const getCalendarDays = (year: number, month: number): readonly CalendarDayDataInterface[][] => {
    const today = new Date();
    const isCurrentMonthYear = today.getFullYear() === year && today.getMonth() === month;
    const todayDate = today.getDate();

    const firstDayWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startOffset = (firstDayWeekday + 6) % DAYS_IN_WEEK;
    const prevMonthDays = new Date(year, month, 0).getDate();

    const allDays: CalendarDayDataInterface[] = [];

    for (let i = startOffset - 1; i >= 0; i -= 1) {
        allDays.push({ day: prevMonthDays - i, isCurrentMonth: false, isToday: false });
    }

    for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber += 1) {
        allDays.push({ day: dayNumber, isCurrentMonth: true, isToday: isCurrentMonthYear && dayNumber === todayDate });
    }

    let nextMonthDay = 1;
    while (allDays.length % DAYS_IN_WEEK !== 0) {
        allDays.push({ day: nextMonthDay, isCurrentMonth: false, isToday: false });
        nextMonthDay += 1;
    }

    const rows: CalendarDayDataInterface[][] = [];
    for (let i = 0; i < allDays.length; i += DAYS_IN_WEEK) {
        rows.push(allDays.slice(i, i + DAYS_IN_WEEK));
    }

    return rows;
};
