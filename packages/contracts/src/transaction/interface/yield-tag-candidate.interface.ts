import type { TransactionEntityInterface } from '../entity/transaction-entity.interface';

export interface YieldTagCandidateInterface extends Pick<
    TransactionEntityInterface,
    'id' | 'type' | 'externalId' | 'title' | 'fundAccountId'
> {
    readonly isFundInZone: boolean;
}
