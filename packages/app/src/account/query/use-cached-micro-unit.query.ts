import { useRef } from 'react';

import { isDefined } from '@rnw-community/shared';

import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';

export const useCachedMicroUnitQuery = (microUnitValue: number | null | undefined): number => {
    const previousValueRef = useRef(0);

    if (isDefined(microUnitValue)) {
        previousValueRef.current = convertFromMicroUnits(microUnitValue);
    }

    return previousValueRef.current;
};
