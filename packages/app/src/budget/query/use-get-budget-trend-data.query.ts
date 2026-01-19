import { useEffect, useState } from 'react';

import { isPositiveNumber } from '@rnw-community/shared';

import { BudgetTrendDataPointInterface } from '../interface/budget-trend-data-point.interface';
import { budgetHistoryService } from '../service/budget-history.service';

export const useGetBudgetTrendDataQuery = (budgetId: number | undefined, periodCount?: number) => {
    const [trendData, setTrendData] = useState<BudgetTrendDataPointInterface[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isPositiveNumber(budgetId)) {
            setTrendData([]);

            return;
        }

        setIsLoading(true);
        void budgetHistoryService
            .getTrendData(budgetId, periodCount)
            .then(setTrendData)
            .catch(() => void setTrendData([]))
            .finally(() => void setIsLoading(false));
    }, [budgetId, periodCount]);

    return { trendData, isLoading };
};
