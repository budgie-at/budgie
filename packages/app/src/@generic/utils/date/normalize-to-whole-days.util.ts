import { endOfDay } from 'date-fns/endOfDay';
import { startOfDay } from 'date-fns/startOfDay';

import { isDefined } from '@rnw-community/shared';

import type { DateRangeInterface } from '@budgie/contracts';

export const normalizeToWholeDays = (range: DateRangeInterface | null): DateRangeInterface | null => {
    if (!isDefined(range)) {
        return null;
    }

    return {
        from: isDefined(range.from) ? startOfDay(range.from) : null,
        to: isDefined(range.to) ? endOfDay(range.to) : null
    };
};
