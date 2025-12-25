export const formatCompactNumbers = (value: number, locale = 'en') =>
    new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(value);
