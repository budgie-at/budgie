const MARCH_MONTH_INDEX = 2;
const OCTOBER_MONTH_INDEX = 9;
const DAYLIGHT_SAVING_SWITCH_UTC_HOUR = 1;
const KYIV_STANDARD_OFFSET_MILLISECONDS = 2 * 60 * 60 * 1000;
const KYIV_DAYLIGHT_SAVING_OFFSET_MILLISECONDS = 3 * 60 * 60 * 1000;

const findLastSundayUtc = (year: number, monthIndex: number): number => {
    const lastDayOfMonth = new Date(Date.UTC(year, monthIndex + 1, 0));

    return Date.UTC(year, monthIndex, lastDayOfMonth.getUTCDate() - lastDayOfMonth.getUTCDay(), DAYLIGHT_SAVING_SWITCH_UTC_HOUR);
};

export const convertKyivWallClockToUtc = (wallClock: Date): Date => {
    const year = wallClock.getUTCFullYear();
    const daylightSavingCandidate = wallClock.getTime() - KYIV_DAYLIGHT_SAVING_OFFSET_MILLISECONDS;
    const isDaylightSaving =
        daylightSavingCandidate >= findLastSundayUtc(year, MARCH_MONTH_INDEX) &&
        daylightSavingCandidate < findLastSundayUtc(year, OCTOBER_MONTH_INDEX);

    return new Date(
        wallClock.getTime() - (isDaylightSaving ? KYIV_DAYLIGHT_SAVING_OFFSET_MILLISECONDS : KYIV_STANDARD_OFFSET_MILLISECONDS)
    );
};
