import { array } from 'zod';

import { AssetTransactionLineCreateEntitySchema } from '../../../transaction-line/schema/asset/asset-transaction-line-create-entity.schema';

import { TransferAssetTransactionEntitySchema } from './transfer-asset-transaction-entity.schema';
import { BaseTransactionCreateEntityFieldsSchema } from '../base/base-transaction-create-entity-fields.schema';

export const TransferAssetTransactionCreateEntitySchema = TransferAssetTransactionEntitySchema.pick({
    type: true
}).extend({
    ...BaseTransactionCreateEntityFieldsSchema.shape,
    lines: array(AssetTransactionLineCreateEntitySchema).length(2).describe('Lines associated with the asset-transfer transaction.')
});
