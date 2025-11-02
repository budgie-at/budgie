import { literal } from 'zod';

import { TransactionTypeEnum } from '../../enum/transaction-type.enum';
import { TransactionEntitySchema } from '../transaction-entity.schema';

export const TransferAssetTransactionEntitySchema = TransactionEntitySchema.extend({
    type: literal(TransactionTypeEnum.TRANSFER)
});
