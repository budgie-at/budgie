import { BaseTransactionCreateEntityFieldsSchema } from '../base/base-transaction-create-entity-fields.schema';

import { ExpenseAssetTransactionEntitySchema } from './expense-asset-transaction-entity.schema';

export const ExpenseAssetTransactionCreateEntitySchema = ExpenseAssetTransactionEntitySchema.pick({
    type: true
}).extend(BaseTransactionCreateEntityFieldsSchema.omit({ type: true }).shape);
