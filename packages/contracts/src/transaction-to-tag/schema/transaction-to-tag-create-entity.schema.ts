import { TransactionToTagEntitySchema } from './transaction-to-tag-entity.schema';

export const TransactionToTagCreateEntitySchema = TransactionToTagEntitySchema.pick({
    transactionId: true,
    tagId: true
});
