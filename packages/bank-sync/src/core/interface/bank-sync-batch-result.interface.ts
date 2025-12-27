import type { BankTransactionInterface } from './bank-transaction.interface';

export interface BankSyncBatchResultInterface {
    readonly transactions: BankTransactionInterface[];
    readonly nextToTime: number;
    readonly completed: boolean;
}
