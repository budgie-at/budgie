import type { TransactionCreateInputSchema } from '../schema/transaction-create-input.schema';
import type { Mutable } from 'effect/Types';

export type TransactionCreateInputInterface = Mutable<typeof TransactionCreateInputSchema.Type>;
