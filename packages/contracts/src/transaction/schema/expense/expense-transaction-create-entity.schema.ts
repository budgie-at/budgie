import { BaseTransactionCreateEntityFieldsSchema } from '../base/base-transaction-create-entity-fields.schema';

import { ExpenseTransactionEntitySchema } from './expense-transaction-entity.schema';

export const ExpenseTransactionCreateEntitySchema = ExpenseTransactionEntitySchema.pick({ type: true }).extend(
    BaseTransactionCreateEntityFieldsSchema.omit({ type: true }).shape
);
