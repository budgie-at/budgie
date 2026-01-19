import { BudgetEntityInterface } from '@budgie/contracts';
import { useEffect, useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { BudgetCalculationResultInterface } from '../interface/budget-calculation-result.interface';
import { budgetCalculationService } from '../service/budget-calculation.service';

export const useGetBudgetCalculationQuery = (budget: BudgetEntityInterface | null | undefined) => {
    const [calculation, setCalculation] = useState<BudgetCalculationResultInterface | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isDefined(budget)) {
            setCalculation(null);

            return;
        }

        setIsLoading(true);
        void budgetCalculationService
            .calculate(budget)
            .then(setCalculation)
            .catch(() => void setCalculation(null))
            .finally(() => void setIsLoading(false));
    }, [budget]);

    return { calculation, isLoading };
};
