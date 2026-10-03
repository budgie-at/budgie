import type { TransactionUpdateServiceInputInterface } from '@budgie/contracts';

export interface UpsertTransactionEntriesAndTagsInputInterface {
    readonly transactionId: number;
    readonly input: TransactionUpdateServiceInputInterface;
    readonly operatedAt: Date;
    readonly isConsolidated: boolean;
}
