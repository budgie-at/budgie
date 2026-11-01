import type { BudgetEntityInterface } from '@budgie/contracts';

export type BudgetWindowSourceInterface = Pick<
    BudgetEntityInterface,
    'kind' | 'period' | 'periodStartDay' | 'useLastDayOfMonth' | 'periodAnchorDate' | 'startsAt' | 'endsAt'
>;
