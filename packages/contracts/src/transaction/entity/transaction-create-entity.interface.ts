import { TransactionEntityInterface } from '@/transaction';

const TransactionCreateEntityFields = ['accountId', 'title', 'operationDate', 'amount', 'comment', 'type'] as const;

export interface TransactionCreateEntityInterface
    extends Pick<TransactionEntityInterface, (typeof TransactionCreateEntityFields)[number]> {}
