export const subtractMonths = (date: Date, months: number): Date =>
    new Date(date.getFullYear(), date.getMonth() - months, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());
