import type { TransactionTagsEntityInterface } from './transaction-tags-entity.interface';

export type TransactionTagsCreateEntityInterface = Pick<TransactionTagsEntityInterface, 'transactionId' | 'tagId' | 'isPrimary' | 'source'>;
