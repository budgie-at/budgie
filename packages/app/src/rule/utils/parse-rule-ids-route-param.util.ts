import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { normalizeRouteParam } from '../../@generic/utils/normalize-route-param.util';

export const parseRuleIdsRouteParam = (value: string | string[] | undefined): number[] => {
    const normalizedValue = normalizeRouteParam(value);

    if (!isDefined(normalizedValue)) {
        return [];
    }

    return normalizedValue.split(',').map(Number).filter(isPositiveNumber);
};
