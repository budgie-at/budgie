import { array } from 'zod';

import { AssetTransactionLineEntitySchema } from '../../../transaction-line/schema/asset/asset-transaction-line-entity.schema';
import { validateAssetTransferLines } from '../../../transaction-line/util/validate-asset-transfer-lines.util';
import { BaseTransactionCreateEntityFieldsSchema } from '../base/base-transaction-create-entity-fields.schema';

import { BuyAssetTransactionEntitySchema } from './buy-asset-transaction-entity.schema';

export const BuyAssetTransactionCreateEntitySchema = BuyAssetTransactionEntitySchema.pick({ type: true })
    .extend({
        ...BaseTransactionCreateEntityFieldsSchema.shape,
        lines: array(AssetTransactionLineEntitySchema).length(1)
    })
    .superRefine(({ lines }, ctx) => {
        validateAssetTransferLines(lines, ctx);
    });
