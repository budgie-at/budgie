import type { TransactionCreateEntityInterface } from '../entity/transaction-create-entity.interface';

export type TransactionUpdateInputInterface = Partial<
    Pick<
        TransactionCreateEntityInterface,
        'title' | 'comment' | 'type' | 'operatedAt' | 'fromAccountId' | 'toAccountId' | 'exchangeRate' | 'needsEmbedding' | 'updatedBy'
    >
>;
