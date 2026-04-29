import type { TransactionEntityInterface } from '../entity/transaction-entity.interface';

export type TransactionUpdateInputInterface = Partial<
    Pick<
        TransactionEntityInterface,
        'title' | 'comment' | 'type' | 'operatedAt' | 'fromAccountId' | 'toAccountId' | 'exchangeRate' | 'needsEmbedding'
    >
>;
