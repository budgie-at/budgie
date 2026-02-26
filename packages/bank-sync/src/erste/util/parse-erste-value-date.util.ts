export const parseErsteValueDate = (ddmm: string, statementDate: Date): Date => {
    const day = parseInt(ddmm.slice(0, 2), 10);
    const month = parseInt(ddmm.slice(2, 4), 10) - 1;

    let year = statementDate.getFullYear();

    if (month > statementDate.getMonth()) {
        year -= 1;
    }

    return new Date(year, month, day, 12, 0, 0);
};
