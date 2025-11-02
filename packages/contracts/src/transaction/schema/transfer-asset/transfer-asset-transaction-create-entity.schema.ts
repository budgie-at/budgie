import { BaseTransactionCreateEntityFieldsSchema } from '../base/base-transaction-create-entity-fields.schema';

import { TransferAssetTransactionEntitySchema } from './transfer-asset-transaction-entity.schema';

export const TransferAssetTransactionCreateEntitySchema = TransferAssetTransactionEntitySchema.pick({
    type: true,
    instrument: true
}).extend(BaseTransactionCreateEntityFieldsSchema.omit({ type: true }).shape);
