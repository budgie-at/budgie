import { array } from 'zod';

import { AssetTransactionLineCreateEntitySchema } from '../../../transaction-line/schema/asset/asset-transaction-line-create-entity.schema';
import { validateAssetExpenseLines } from '../../../transaction-line/util/validate-asset-expense-lines.util';

import { ExpenseAssetTransactionEntitySchema } from './expense-asset-transaction-entity.schema';
import { BaseTransactionCreateEntityFieldsSchema } from '../base/base-transaction-create-entity-fields.schema';

export const ExpenseAssetTransactionCreateEntitySchema = ExpenseAssetTransactionEntitySchema.pick({
    type: true
})
    .extend({
        ...BaseTransactionCreateEntityFieldsSchema.shape,
        lines: array(AssetTransactionLineCreateEntitySchema).min(1).describe('Lines associated with the asset-expense transaction.')
    })
    .superRefine(({ lines }, ctx) => {
        validateAssetExpenseLines(lines, ctx);
    });
