import { BaseTransactionCreateEntityFieldsSchema } from '../base/base-transaction-create-entity-fields.schema';

import { SellAssetTransactionEntitySchema } from './sell-asset-transaction-entity.schema';

export const SellAssetTransactionCreateEntitySchema = SellAssetTransactionEntitySchema.pick({
    type: true,
    instrument: true
}).extend(BaseTransactionCreateEntityFieldsSchema.omit({ type: true }).shape);
