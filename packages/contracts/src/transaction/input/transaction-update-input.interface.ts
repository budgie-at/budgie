import type { TransactionTypeEnum } from '../enum/transaction-type.enum';

export interface TransactionUpdateInputInterface {
    readonly title?: string;
    readonly comment?: string;
    readonly type?: TransactionTypeEnum;
    readonly operatedAt?: Date;
    readonly fromAccountId?: number | null;
    readonly toAccountId?: number | null;
    readonly exchangeRate?: number;
    readonly needsEmbedding?: boolean;
}
