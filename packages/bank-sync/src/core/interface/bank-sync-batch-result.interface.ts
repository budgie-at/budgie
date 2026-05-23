import type { BankTransactionInterface } from './bank-transaction.interface';
import type { BankSyncBatchReasonEnum } from '../enum/bank-sync-batch-reason.enum';

export interface BankSyncBatchResultInterface {
    readonly transactions: BankTransactionInterface[];
    readonly nextTo: Date;
    readonly nextFrom: Date;
    readonly completed: boolean;
    readonly reason: BankSyncBatchReasonEnum;
}
