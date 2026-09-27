import type { TransactionCategorizeInboxRepository } from '@budgie/contracts';

export type CategorizeInboxRowsQueryType = ReturnType<TransactionCategorizeInboxRepository['findUncategorizedRows']>;
