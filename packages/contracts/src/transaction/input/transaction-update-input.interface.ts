import type { TransactionCreateEntityInterface } from '../entity/transaction-create-entity.interface';

export type TransactionUpdateInputInterface = Partial<
    Pick<
        TransactionCreateEntityInterface,
        | 'title'
        | 'comment'
        | 'type'
        | 'externalId'
        | 'operatedAt'
        | 'fromAccountId'
        | 'toAccountId'
        | 'exchangeRate'
        | 'externalSource'
        | 'needsEmbedding'
        | 'updatedBy'
    >
>;
