import type { RecurringSeriesEntityInterface } from '@budgie/contracts';

export interface RecurringMatchSeriesInterface {
    readonly series: Pick<
        RecurringSeriesEntityInterface,
        | 'source'
        | 'id'
        | 'kind'
        | 'merchantKey'
        | 'title'
        | 'accountId'
        | 'userState'
        | 'cadenceUnit'
        | 'cadenceInterval'
        | 'anchorDate'
        | 'endsAt'
    > & { readonly defaultAmount: number };
    readonly isVariable?: boolean;
    readonly userIdentities: ReadonlySet<string>;
    readonly occupiedCycles: ReadonlySet<number>;
    readonly excludedTransactionIds: ReadonlySet<number>;
}
