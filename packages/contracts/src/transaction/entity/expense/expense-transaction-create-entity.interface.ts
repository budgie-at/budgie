import type { ExpenseTransactionCreateEntitySchema } from '../../schema/expense-transaction-create-entity.schema';
import type { infer } from 'zod';

export interface ExpenseTransactionCreateEntityInterface extends infer<typeof ExpenseTransactionCreateEntitySchema> {}
