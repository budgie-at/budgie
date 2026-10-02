import type { TransactionEntryCreateInputSchema } from '../schema/transaction-entry-create-input.schema';
import type { Mutable } from 'effect/Types';

export type TransactionEntryCreateInputInterface = Mutable<typeof TransactionEntryCreateInputSchema.Type>;
