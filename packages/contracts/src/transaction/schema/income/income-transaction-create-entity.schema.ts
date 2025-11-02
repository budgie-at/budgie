import { BaseTransactionCreateEntityFieldsSchema } from '../base/base-transaction-create-entity-fields.schema';

import { IncomeTransactionEntitySchema } from './income-transaction-entity.schema';

export const IncomeTransactionCreateEntitySchema = IncomeTransactionEntitySchema.pick({ type: true }).extend(
    BaseTransactionCreateEntityFieldsSchema.omit({ type: true }).shape
);
