import { BudgetPeriodSnapshotEntityInterface } from '@budgie/contracts';
import { useEffect, useState } from 'react';

import { isPositiveNumber } from '@rnw-community/shared';

import { budgetHistoryService } from '../service/budget-history.service';

export const useGetBudgetSnapshotsQuery = (budgetId: number | undefined, limit?: number) => {
    const [snapshots, setSnapshots] = useState<BudgetPeriodSnapshotEntityInterface[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isPositiveNumber(budgetId)) {
            setSnapshots([]);

            return;
        }

        setIsLoading(true);
        void budgetHistoryService
            .getSnapshots(budgetId, limit)
            .then(setSnapshots)
            .catch(() => void setSnapshots([]))
            .finally(() => void setIsLoading(false));
    }, [budgetId, limit]);

    return { snapshots, isLoading };
};
