import { isDefined } from '@rnw-community/shared';

import { FUND_YEARLY_MONTHS } from '../constant/budget-fund-repeat-months.constant';
import { BudgetFundRepeatEnum } from '../enum/budget-fund-repeat.enum';

export const resolveFundRepeat = (repeatEveryMonths: number | null): BudgetFundRepeatEnum => {
    if (!isDefined(repeatEveryMonths)) {
        return BudgetFundRepeatEnum.ONCE;
    }

    return repeatEveryMonths === FUND_YEARLY_MONTHS ? BudgetFundRepeatEnum.YEARLY : BudgetFundRepeatEnum.CUSTOM;
};
