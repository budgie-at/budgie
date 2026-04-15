import { useRef } from 'react';

import { isDefined } from '@rnw-community/shared';

import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';

export const useCachedMicroUnitQuery = (microUnitValue: number | null | undefined, dependencies: unknown[]): number => {
    const previousValueRef = useRef(0);
    const previousDependenciesRef = useRef(dependencies);

    const haveDependenciesChanged =
        dependencies.length !== previousDependenciesRef.current.length ||
        dependencies.some((dependency, index) => dependency !== previousDependenciesRef.current[index]);

    if (isDefined(microUnitValue)) {
        previousValueRef.current = convertFromMicroUnits(microUnitValue);
    } else if (haveDependenciesChanged) {
        previousValueRef.current = 0;
    }

    previousDependenciesRef.current = dependencies;

    return previousValueRef.current;
};
