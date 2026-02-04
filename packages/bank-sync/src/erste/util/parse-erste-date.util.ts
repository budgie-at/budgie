export const parseErsteValueDate = (ddmm: string, statementDate: Date): Date => {
    const day = parseInt(ddmm.slice(0, 2), 10);
    const month = parseInt(ddmm.slice(2, 4), 10) - 1;

    let year = statementDate.getFullYear();

    if (month > statementDate.getMonth()) {
        year -= 1;
    }

    return new Date(year, month, day, 12, 0, 0);
};

export const parseErsteStatementDate = (dateString: string): Date | null => {
    const match = dateString.match(/(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})/u);

    if (!match) {
        return null;
    }

    const [, day, month, year, hours, minutes] = match;

    return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10), parseInt(hours, 10), parseInt(minutes, 10));
};
