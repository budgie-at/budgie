import { useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';

export const useCachedMicroUnitQuery = (microUnitValue: number | null | undefined): number => {
    const [cachedValue, setCachedValue] = useState(0);
    const currentValue = isDefined(microUnitValue) ? convertFromMicroUnits(microUnitValue) : cachedValue;

    if (currentValue !== cachedValue) {
        setCachedValue(currentValue);
    }

    return currentValue;
};
