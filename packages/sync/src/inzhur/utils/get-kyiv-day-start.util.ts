import { convertKyivWallClockToUtc } from '../../core/utils/convert-kyiv-wall-clock-to-utc.util';

export const getKyivDayStart = (day: string, offsetDays = 0): Date => {
    const shifted = new Date(Date.parse(`${day}T00:00:00.000Z`));

    shifted.setUTCDate(shifted.getUTCDate() + offsetDays);

    return convertKyivWallClockToUtc(shifted);
};
