import type { IncomeTransactionCreateEntitySchema } from '../../schema/income-transaction-create-entity.schema';
import type { infer } from 'zod';

export interface IncomeTransactionCreateEntityInterface extends infer<typeof IncomeTransactionCreateEntitySchema> {}
