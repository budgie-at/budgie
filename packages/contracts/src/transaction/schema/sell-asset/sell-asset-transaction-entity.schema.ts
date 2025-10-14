import { array, literal, union } from 'zod';

import { AssetTransactionLineEntitySchema } from '../../../transaction-line/schema/asset/asset-transaction-line-entity.schema';
import { MoneyTransactionLineEntitySchema } from '../../../transaction-line/schema/money/money-transaction-line-entity.schema';
import { validateLineLinkageToTransaction } from '../../../transaction-line/util/validate-line-linked-to-transaction.util';
import { TransactionTypeEnum } from '../../enum/transaction-type.enum';
import { TransactionEntitySchema } from '../transaction-entity.schema';

export const SellAssetTransactionEntitySchema = TransactionEntitySchema.omit({
    lines: true,
    type: true
})
    .extend({
        type: literal(TransactionTypeEnum.SELL_ASSET),
        lines: array(union([AssetTransactionLineEntitySchema, MoneyTransactionLineEntitySchema]))
            .min(2)
            .describe('Lines associated with the sell asset transaction.')
    })
    .superRefine(({ id, lines }, ctx) => {
        validateLineLinkageToTransaction(id, lines, ctx);
    });
