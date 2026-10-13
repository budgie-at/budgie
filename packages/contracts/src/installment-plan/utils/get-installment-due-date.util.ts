export const getInstallmentDueDate = (anchorAt: Date, monthOffset: number): Date => {
    const year = anchorAt.getFullYear();
    const month = anchorAt.getMonth() + monthOffset;
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

    return new Date(
        year,
        month,
        Math.min(anchorAt.getDate(), lastDayOfMonth),
        anchorAt.getHours(),
        anchorAt.getMinutes(),
        anchorAt.getSeconds()
    );
};
