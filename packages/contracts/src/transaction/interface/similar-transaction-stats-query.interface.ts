import type { TransactionTypeEnum } from '../enum/transaction-type.enum';

export interface SimilarTransactionStatsQueryInterface {
    readonly transactionId: number;
    readonly type: TransactionTypeEnum;
    readonly operatedAt: Date;
    readonly title: string;
    readonly comment: string;
    readonly accountId: number;
    readonly categoryId: number | null;
    readonly months: number;
}
