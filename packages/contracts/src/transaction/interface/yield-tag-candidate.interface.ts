import type { TransactionEntityInterface } from '../entity/transaction-entity.interface';

export type YieldTagCandidateInterface = Pick<
    TransactionEntityInterface,
    'id' | 'type' | 'externalId' | 'title' | 'fundAccountId' | 'toAccountId' | 'fromAccountId'
>;
