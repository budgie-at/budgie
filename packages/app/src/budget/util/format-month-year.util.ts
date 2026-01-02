export const formatMonthYear = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' };

    return date.toLocaleDateString('en-US', options);
};

