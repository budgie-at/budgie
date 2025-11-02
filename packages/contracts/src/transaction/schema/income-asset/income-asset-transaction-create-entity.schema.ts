import { BaseTransactionCreateEntityFieldsSchema } from '../base/base-transaction-create-entity-fields.schema';

import { IncomeAssetTransactionEntitySchema } from './income-asset-transaction-entity.schema';

export const IncomeAssetTransactionCreateEntitySchema = IncomeAssetTransactionEntitySchema.pick({
    type: true
}).extend(BaseTransactionCreateEntityFieldsSchema.shape);
