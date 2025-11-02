import { BaseTransactionCreateEntityFieldsSchema } from '../base/base-transaction-create-entity-fields.schema';

import { BuyAssetTransactionEntitySchema } from './buy-asset-transaction-entity.schema';

export const BuyAssetTransactionCreateEntitySchema = BuyAssetTransactionEntitySchema.pick({
    type: true,
    transferDirection: true,
    instrument: true
}).extend(BaseTransactionCreateEntityFieldsSchema.omit({ type: true }).shape);
