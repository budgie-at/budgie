import { BudgetEntityInterface } from '@budgie/contracts';
import { useEffect, useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { BudgetCalculationResultInterface } from '../interface/budget-calculation-result.interface';
import { budgetCalculationService } from '../service/budget-calculation.service';

interface DateRangeOverrideInterface {
    readonly startDate: Date;
    readonly endDate: Date;
}

export const useGetBudgetCalculationQuery = (
    budget: BudgetEntityInterface | null | undefined,
    dateRangeOverride?: DateRangeOverrideInterface
) => {
    const [calculation, setCalculation] = useState<BudgetCalculationResultInterface | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<unknown>(null);

    useEffect(() => {
        if (!isDefined(budget)) {
            setCalculation(null);
            setError(null);

            return;
        }

        setIsLoading(true);
        setError(null);
        void budgetCalculationService
            .calculate(budget, dateRangeOverride)
            .then(setCalculation)
            .catch((calculationError: unknown) => {
                setCalculation(null);
                setError(calculationError);
            })
            .finally(() => void setIsLoading(false));
    }, [budget, budget?.startDate.getTime(), budget?.endDate.getTime(), dateRangeOverride?.startDate, dateRangeOverride?.endDate]);

    return { calculation, isLoading, error };
};
