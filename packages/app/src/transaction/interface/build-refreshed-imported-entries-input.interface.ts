import type {
    TransactionCreateInputInterface,
    TransactionEntryCreateInputInterface,
    TransactionEntryEntityInterface
} from '@budgie/contracts';

export interface BuildRefreshedImportedEntriesInputInterface {
    readonly existingEntries: TransactionEntryEntityInterface[];
    readonly inputEntries: TransactionEntryCreateInputInterface[];
    readonly transactionId: number;
    readonly input: TransactionCreateInputInterface;
}
