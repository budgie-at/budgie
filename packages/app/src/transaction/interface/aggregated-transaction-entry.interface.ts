import type { TransactionEntryKindEnum, TransactionEntryTypeEnum, TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export interface AggregatedTransactionEntryInterface {
    readonly amount: number;
    readonly baseAmount: number | null;
    readonly kind: TransactionEntryKindEnum;
    readonly type: TransactionEntryTypeEnum;
    readonly account: TransactionWithRelationsEntityInterface['entries'][number]['account'];
}
