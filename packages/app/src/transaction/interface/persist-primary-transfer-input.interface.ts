import type {
    DB,
    TransactionCreateInputInterface,
    TransactionEntityInterface,
    TransactionEntryCreateInputInterface
} from '@budgie/contracts';

export interface PersistPrimaryTransferInputInterface {
    readonly transaction: TransactionEntityInterface;
    readonly input: TransactionCreateInputInterface;
    readonly fromEntry: TransactionEntryCreateInputInterface;
    readonly toEntry: TransactionEntryCreateInputInterface;
    readonly fromAmountInMicroUnits: number;
    readonly toAmountInMicroUnits: number;
    readonly tx: DB;
}
