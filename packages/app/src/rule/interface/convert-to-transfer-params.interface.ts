import type { Transaction } from '../../@generic/type/transaction.type';

export interface ConvertToTransferParamsInterface {
    readonly transactionId: number;
    readonly targetAccountId: number;
    readonly dbTransaction: Transaction;
}
