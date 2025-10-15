import { array, literal, union } from 'zod';

import { AssetTransactionLineEntitySchema } from '../../../transaction-line/schema/asset/asset-transaction-line-entity.schema';
import { MoneyTransactionLineEntitySchema } from '../../../transaction-line/schema/money/money-transaction-line-entity.schema';
import { TransactionTypeEnum } from '../../enum/transaction-type.enum';
import { TransactionEntitySchema } from '../transaction-entity.schema';

export const BuyAssetTransactionEntitySchema = TransactionEntitySchema.omit({
    lines: true,
    type: true
}).extend({
    type: literal(TransactionTypeEnum.TRANSFER),
    lines: array(union([AssetTransactionLineEntitySchema, MoneyTransactionLineEntitySchema]))
        .min(2)
        .describe('Lines associated with the buy asset transaction.')
});
