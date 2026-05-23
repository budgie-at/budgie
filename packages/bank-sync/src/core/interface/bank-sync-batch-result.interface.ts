import type { BankTransactionInterface } from './bank-transaction.interface';

export interface BankSyncBatchResultInterface {
    readonly transactions: BankTransactionInterface[];
    readonly nextTo: Date;
    readonly nextFrom: Date;
    readonly completed: boolean;
}
