import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { normalizeRouteParam } from './normalize-route-param.util';

export const parsePositiveRouteParam = (value: string | string[] | undefined): number | null => {
    const normalizedValue = normalizeRouteParam(value);

    return isDefined(normalizedValue) && isPositiveNumber(Number(normalizedValue)) ? Number(normalizedValue) : null;
};
