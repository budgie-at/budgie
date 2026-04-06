import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useRef } from 'react';

import { isDefined } from '@rnw-community/shared';

import { accountBalanceRepository } from '../../@generic/drizzle/db/db';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';

type BalanceQuery = ReturnType<typeof accountBalanceRepository.getByAccountId>;

export const useCachedBalanceQuery = (query: BalanceQuery, dependencies: unknown[]) => {
    const { data } = useLiveQuery(query, dependencies);
    const previousBalanceRef = useRef(0);
    const previousDependenciesRef = useRef(dependencies);

    const balance = data.at(0)?.balance;
    const haveDependenciesChanged =
        dependencies.length !== previousDependenciesRef.current.length ||
        dependencies.some((dependency, index) => dependency !== previousDependenciesRef.current[index]);

    if (isDefined(balance)) {
        previousBalanceRef.current = convertFromMicroUnits(balance);
    } else if (haveDependenciesChanged) {
        previousBalanceRef.current = 0;
    }

    previousDependenciesRef.current = dependencies;

    return { balance: previousBalanceRef.current };
};
