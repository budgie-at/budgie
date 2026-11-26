import type { TransactionEntityInterface, TransactionEntryEntityInterface } from '@budgie/contracts';

export interface ComputeRefundCapacityUsageInputInterface {
    readonly expenseEntries: readonly TransactionEntryEntityInterface[];
    readonly expenseAccountId: number;
    readonly absorbedEntries: readonly TransactionEntryEntityInterface[];
    readonly absorbedSourceById: ReadonlyMap<number, Pick<TransactionEntityInterface, 'title'>>;
    readonly incomingTitle: string;
}
