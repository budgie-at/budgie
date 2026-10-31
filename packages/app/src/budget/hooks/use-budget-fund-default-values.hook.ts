import { addMonths } from 'date-fns/addMonths';

import { useToday } from '../../@generic/hook/use-today.hook';
import { FUND_YEARLY_MONTHS } from '../constant/budget-fund-repeat-months.constant';

import type { BudgetFundFormValues } from '../constant/budget-fund-form-schema.constant';

export const useBudgetFundDefaultValues = (): BudgetFundFormValues => ({
    name: '',
    categoryId: 0,
    targetAmount: 0,
    dueAtMs: addMonths(useToday(), FUND_YEARLY_MONTHS).getTime(),
    repeatEveryMonths: FUND_YEARLY_MONTHS,
    recurringSeriesId: null
});
