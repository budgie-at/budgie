import type { ExpenseTransactionEntitySchema } from '../../schema/expense-transaction-entity.schema';
import type { infer } from 'zod';

export interface ExpenseTransactionEntityInterface extends infer<typeof ExpenseTransactionEntitySchema> {}
