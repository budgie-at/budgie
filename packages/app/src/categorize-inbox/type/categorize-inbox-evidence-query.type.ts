import type { TransactionCategorizeInboxRepository } from '@budgie/contracts';

export type CategorizeInboxEvidenceQueryType =
    | ReturnType<TransactionCategorizeInboxRepository['findCategoryEvidence']>
    | ReturnType<TransactionCategorizeInboxRepository['findTagEvidence']>;
