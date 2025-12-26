import { TransactionEntryCreateEntitySchema } from './transaction-entry-create-entity.schema';

export const TransactionEntryCreateInputSchema = TransactionEntryCreateEntitySchema.omit({ transactionId: true });
