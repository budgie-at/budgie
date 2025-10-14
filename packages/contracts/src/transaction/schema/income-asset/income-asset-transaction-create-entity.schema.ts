import { array } from 'zod';

import { AssetTransactionLineCreateEntitySchema } from '../../../transaction-line/schema/asset/asset-transaction-line-create-entity.schema';
import { validateAssetIncomeLines } from '../../../transaction-line/util/validate-asset-income-lines.util';

import { IncomeAssetTransactionEntitySchema } from './income-asset-transaction-entity.schema';
import { BaseTransactionCreateEntityFieldsSchema } from '../base/base-transaction-create-entity-fields.schema';

export const IncomeAssetTransactionCreateEntitySchema = IncomeAssetTransactionEntitySchema.pick({
    type: true
})
    .extend({
        ...BaseTransactionCreateEntityFieldsSchema.shape,
        lines: array(AssetTransactionLineCreateEntitySchema).min(1).describe('Lines associated with the asset-income transaction.')
    })
    .superRefine(({ lines }, ctx) => {
        validateAssetIncomeLines(lines, ctx);
    });
