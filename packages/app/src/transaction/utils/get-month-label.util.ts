export const getMonthLabel = (year: number, month: number, locale: string): string =>
    new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(year, month, 1));
