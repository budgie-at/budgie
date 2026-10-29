import { isDefined } from '@rnw-community/shared';

import type { DateRangeInterface } from '@budgie/contracts';

export const getCalendarVisibleDate = (range: DateRangeInterface | null): Date | null => {
    if (!isDefined(range)) {
        return null;
    }

    const { from, to } = range;
    const now = new Date();

    if (isDefined(from) && isDefined(to)) {
        const nowTime = now.getTime();
        const fromTime = from.getTime();
        const toTime = to.getTime();
        const isNowInRange = fromTime <= nowTime && nowTime <= toTime;

        if (isNowInRange) {
            return now;
        }

        return nowTime - fromTime < toTime - nowTime ? from : to;
    }

    if (isDefined(to)) {
        return to;
    }

    return from;
};
