import { TransactionEntryCreateInputInterface } from '../../transaction/schema/transaction-create-input.schema';

export const sumEntriesAmount = (entries: Pick<TransactionEntryCreateInputInterface, 'amount'>[]): number =>
    entries.reduce((acc, curr) => acc + curr.amount, 0);
