import { BudgetCreateInputInterface, BudgetPeriodEnum, BudgetStatusEnum } from '@budgie/contracts';

export const DEFAULT_BUDGET_FORM_VALUES: BudgetCreateInputInterface = {
    title: '',
    period: BudgetPeriodEnum.MONTHLY,
    status: BudgetStatusEnum.DRAFT,
    instrumentId: 1
};
