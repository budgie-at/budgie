import type { BudgetEntityInterface } from '@budgie/contracts';

export interface BudgetProjectionKeyInterface extends Pick<
    BudgetEntityInterface,
    'id' | 'period' | 'periodStartDay' | 'useLastDayOfMonth' | 'periodAnchorDate' | 'instrumentId' | 'overallLimit' | 'otherLimit'
> {
    readonly dayStart: number;
}
