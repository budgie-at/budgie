import { TransactionTagsEntitySchema } from './transaction-tags-entity.schema';

export const TransactionTagsCreateEntitySchema = TransactionTagsEntitySchema.pick({
    transactionId: true,
    tagId: true,
    isPrimary: true
});
