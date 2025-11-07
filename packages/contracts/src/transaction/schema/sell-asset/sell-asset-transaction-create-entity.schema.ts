import { convertToCreateEntitySchema } from '../../../generic/util/convert-to-create-entity-schema.util';

import { SellAssetTransactionEntitySchema } from './sell-asset-transaction-entity.schema';

export const SellAssetTransactionCreateEntitySchema = convertToCreateEntitySchema(SellAssetTransactionEntitySchema).partial({
    comment: true,
    operatedAt: true
});
