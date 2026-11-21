import * as DateTime from 'effect/DateTime';
import * as Option from 'effect/Option';

export const getKyivDayStart = (day: string, offsetDays = 0): Date => {
    const shifted = new Date(Date.parse(`${day}T00:00:00.000Z`));

    shifted.setUTCDate(shifted.getUTCDate() + offsetDays);

    return Option.match(
        DateTime.makeZoned(
            { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate() },
            { timeZone: 'Europe/Kyiv', adjustForTimeZone: true }
        ),
        { onNone: () => shifted, onSome: zoned => new Date(DateTime.toEpochMillis(zoned)) }
    );
};
