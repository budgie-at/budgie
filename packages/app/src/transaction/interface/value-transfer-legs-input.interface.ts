import type { DB, TransactionCreateInputInterface, TransactionEntryCreateInputInterface } from '@budgie/contracts';

export interface ValueTransferLegsInputInterface {
    readonly input: TransactionCreateInputInterface;
    readonly fromEntry: TransactionEntryCreateInputInterface;
    readonly toEntry: TransactionEntryCreateInputInterface;
    readonly fromAmountInMicroUnits: number;
    readonly toAmountInMicroUnits: number;
    readonly tx: DB;
}
