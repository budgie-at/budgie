import { array, literal } from 'zod';

import { AssetTransactionLineEntitySchema } from '../../../transaction-line/schema/asset/asset-transaction-line-entity.schema';
import { TransactionTypeEnum } from '../../enum/transaction-type.enum';
import { TransactionEntitySchema } from '../transaction-entity.schema';

export const TransferAssetTransactionEntitySchema = TransactionEntitySchema.omit({
    lines: true,
    type: true
}).extend({
    type: literal(TransactionTypeEnum.TRANSFER),
    lines: array(AssetTransactionLineEntitySchema).length(2).describe('Lines associated with the asset-transfer transaction.')
});
