import type { BudgetEntityInterface } from '@budgie/contracts';

export type BudgetPeriodSpecInterface = Pick<BudgetEntityInterface, 'period' | 'periodStartDay' | 'useLastDayOfMonth' | 'periodAnchorDate'>;
