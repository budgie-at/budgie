import type { BudgetEntityInterface } from './budget-entity.interface';

export type BudgetCreateEntityInterface = Pick<
    BudgetEntityInterface,
    'name' | 'period' | 'periodStartDay' | 'useLastDayOfMonth' | 'overallLimit' | 'otherLimit' | 'instrumentId'
>;
