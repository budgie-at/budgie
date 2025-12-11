export const getStartOfDay = (date: Date): Date => {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);

    return copy;
};
