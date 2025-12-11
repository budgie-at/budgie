export const getEndOfDay = (date: Date): Date => {
    const copy = new Date(date);
    copy.setHours(23, 59, 59, 999);

    return copy;
};
