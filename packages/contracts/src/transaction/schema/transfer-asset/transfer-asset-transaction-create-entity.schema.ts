import { array } from 'zod';

import { AssetTransactionLineCreateEntitySchema } from '../../../transaction-line/schema/asset/asset-transaction-line-create-entity.schema';

import { TransferAssetTransactionEntitySchema } from './transfer-asset-transaction-entity.schema';

export const TransferAssetTransactionCreateEntitySchema = TransferAssetTransactionEntitySchema.pick({
    type: true
}).extend({
    lines: array(AssetTransactionLineCreateEntitySchema).length(2).describe('Lines associated with the asset-transfer transaction.')
});
