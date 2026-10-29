import type { BudgetEntityInterface } from '@budgie/contracts';

export interface BudgetProjectionKeyInterface extends Pick<
    BudgetEntityInterface,
    'id' | 'periodStartDay' | 'useLastDayOfMonth' | 'instrumentId' | 'overallLimit' | 'otherLimit'
> {
    readonly dayStart: number;
}
