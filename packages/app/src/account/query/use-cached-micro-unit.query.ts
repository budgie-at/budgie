import { convertFromMicroUnits } from '@budgie/contracts';
import { useState } from 'react';

import { isDefined } from '@rnw-community/shared';

export const useCachedMicroUnitQuery = (microUnitValue: number | null | undefined): number => {
    const [cachedValue, setCachedValue] = useState(0);
    const currentValue = isDefined(microUnitValue) ? convertFromMicroUnits(microUnitValue) : cachedValue;

    if (currentValue !== cachedValue) {
        setCachedValue(currentValue);
    }

    return currentValue;
};
