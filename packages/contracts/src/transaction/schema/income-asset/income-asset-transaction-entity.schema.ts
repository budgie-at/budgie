import { array, literal } from 'zod';

import { AssetTransactionLineEntitySchema } from '../../../transaction-line/schema/asset/asset-transaction-line-entity.schema';
import { TransactionTypeEnum } from '../../enum/transaction-type.enum';
import { TransactionEntitySchema } from '../transaction-entity.schema';

export const IncomeAssetTransactionEntitySchema = TransactionEntitySchema.omit({
    lines: true,
    type: true
}).extend({
    type: literal(TransactionTypeEnum.INCOME),
    lines: array(AssetTransactionLineEntitySchema).min(1).describe('Lines associated with the asset-income transaction.')
});
