const ISO_DATE_TIME_SEPARATOR = 'T';

export const parseBinanceApplyTimeMs = (applyTime: string): number => {
    const trimmedApplyTime = applyTime.trim();

    return Date.parse(
        trimmedApplyTime.includes(ISO_DATE_TIME_SEPARATOR) ? trimmedApplyTime : `${trimmedApplyTime.replace(' ', ISO_DATE_TIME_SEPARATOR)}Z`
    );
};
