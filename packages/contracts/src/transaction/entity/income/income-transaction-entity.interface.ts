import type { IncomeTransactionEntitySchema } from '../../schema/income-transaction-entity.schema';
import type { infer } from 'zod';

export interface IncomeTransactionEntityInterface extends infer<typeof IncomeTransactionEntitySchema> {}
