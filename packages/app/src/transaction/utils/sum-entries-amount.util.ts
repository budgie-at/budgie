import { TransactionEntryEntityInterface } from '@budgie/contracts';

export const sumEntriesAmount = (entries: Pick<TransactionEntryEntityInterface, 'amount'>[]): number =>
    entries.reduce((acc, curr) => acc + curr.amount, 0);
