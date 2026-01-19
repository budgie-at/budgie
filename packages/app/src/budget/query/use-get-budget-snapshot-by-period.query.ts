import { BudgetPeriodSnapshotEntityInterface } from '@budgie/contracts';
import { useEffect, useState } from 'react';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { budgetPeriodSnapshotRepository } from '../../@generic/drizzle/db/db';

export const useGetBudgetSnapshotByPeriodQuery = (budgetId: number | null | undefined, periodStart: Date | null | undefined) => {
    const [snapshot, setSnapshot] = useState<BudgetPeriodSnapshotEntityInterface | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isPositiveNumber(budgetId) || !isDefined(periodStart)) {
            setSnapshot(null);

            return;
        }

        setIsLoading(true);
        void budgetPeriodSnapshotRepository
            .findByPeriodStart(budgetId, periodStart)
            .then(result => void setSnapshot(result ?? null))
            .catch(() => void setSnapshot(null))
            .finally(() => void setIsLoading(false));
    }, [budgetId, periodStart?.getTime()]);

    return { snapshot, isLoading };
};
