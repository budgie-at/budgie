import { endOfDay } from 'date-fns/endOfDay';
import { isMatch } from 'date-fns/isMatch';
import { parse } from 'date-fns/parse';
import { startOfDay } from 'date-fns/startOfDay';

import { isDefined } from '@rnw-community/shared';

import { ROUTE_DATE_FORMAT } from '../constant/route-date-format.constant';

import type { DateRangeInterface } from '@budgie/contracts';

const parseRouteDate = (value: string | undefined, toBoundary: (date: Date) => Date): Date | null => {
    if (!isDefined(value)) {
        return null;
    }

    return isMatch(value, ROUTE_DATE_FORMAT) ? toBoundary(parse(value, ROUTE_DATE_FORMAT, new Date())) : new Date(value);
};

export const parseRouteDateRange = (startDate: string | undefined, endDate: string | undefined): DateRangeInterface => ({
    from: parseRouteDate(startDate, startOfDay),
    to: parseRouteDate(endDate, endOfDay)
});
