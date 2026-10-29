import type { BudgetEntityInterface } from '@budgie/contracts';

export interface BudgetProjectionKeyInterface extends Pick<
    BudgetEntityInterface,
    | 'id'
    | 'kind'
    | 'period'
    | 'periodStartDay'
    | 'useLastDayOfMonth'
    | 'limitSource'
    | 'instrumentId'
    | 'overallLimit'
    | 'otherLimit'
    | 'tagId'
> {
    readonly periodAnchorMs: number | null;
    readonly startsAtMs: number | null;
    readonly endsAtMs: number | null;
    readonly dayStart: number;
}
