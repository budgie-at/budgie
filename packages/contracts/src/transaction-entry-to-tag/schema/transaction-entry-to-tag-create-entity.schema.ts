import { TransactionEntryToTagEntitySchema } from './transaction-entry-to-tag-entity.schema';

export const TransactionEntryToTagCreateEntitySchema = TransactionEntryToTagEntitySchema.pick({
    transactionEntryId: true,
    tagId: true
});
