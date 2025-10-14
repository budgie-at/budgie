import { array, literal } from 'zod';

import { AssetTransactionLineEntitySchema } from '../../../transaction-line/schema/asset/asset-transaction-line-entity.schema';
import { validateAssetExpenseLines } from '../../../transaction-line/util/validate-asset-expense-lines.util';
import { validateLineLinkageToTransaction } from '../../../transaction-line/util/validate-line-linked-to-transaction.util';
import { TransactionTypeEnum } from '../../enum/transaction-type.enum';
import { TransactionEntitySchema } from '../transaction-entity.schema';

export const ExpenseAssetTransactionEntitySchema = TransactionEntitySchema.omit({
    lines: true,
    type: true
})
    .extend({
        type: literal(TransactionTypeEnum.EXPENSE),
        lines: array(AssetTransactionLineEntitySchema).min(1).describe('Lines associated with the asset-expense transaction.')
    })
    .superRefine(({ id, lines }, ctx) => {
        validateLineLinkageToTransaction(id, lines, ctx);
        validateAssetExpenseLines(lines, ctx);
    });
