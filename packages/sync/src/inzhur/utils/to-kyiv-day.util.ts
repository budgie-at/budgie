const kyivDayFormat = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Kyiv' });

export const toKyivDay = (date: Date): string => kyivDayFormat.format(date);
