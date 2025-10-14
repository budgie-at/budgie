import { array } from 'zod';

import { AssetTransactionLineEntitySchema } from '../../../transaction-line/schema/asset/asset-transaction-line-entity.schema';
import { validateAssetTransferLines } from '../../../transaction-line/util/validate-asset-transfer-lines.util';
import { BaseTransactionCreateEntitySchema } from '../base/base-transaction-create-entity.schema';

import { BuyAssetTransactionEntitySchema } from './buy-asset-transaction-entity.schema';

export const BuyAssetTransactionCreateEntitySchema = BuyAssetTransactionEntitySchema.pick({ type: true })
    .extend({
        ...BaseTransactionCreateEntitySchema.shape,
        lines: array(AssetTransactionLineEntitySchema).length(1)
    })
    .superRefine(({ lines }, ctx) => {
        validateAssetTransferLines(lines, ctx);
    });
