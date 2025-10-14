import { array, union } from 'zod';

import { AssetTransactionLineCreateEntitySchema } from '../../../transaction-line/schema/asset/asset-transaction-line-create-entity.schema';
import { MoneyTransactionLineCreateEntitySchema } from '../../../transaction-line/schema/money/money-transaction-line-create-entity.schema';

import { SellAssetTransactionEntitySchema } from './sell-asset-transaction-entity.schema';
import { BaseTransactionCreateEntityFieldsSchema } from '../base/base-transaction-create-entity-fields.schema';

export const SellAssetTransactionCreateEntitySchema = SellAssetTransactionEntitySchema.pick({
    type: true
}).extend({
    ...BaseTransactionCreateEntityFieldsSchema.shape,
    lines: array(union([AssetTransactionLineCreateEntitySchema, MoneyTransactionLineCreateEntitySchema]))
        .min(2)
        .describe('Lines associated with the sell asset transaction.')
});
