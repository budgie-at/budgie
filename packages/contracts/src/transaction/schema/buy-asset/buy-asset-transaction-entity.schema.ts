import { literal } from 'zod';

import { TransactionTypeEnum } from '../../enum/transaction-type.enum';
import { TransactionEntitySchema } from '../transaction-entity.schema';

export const BuyAssetTransactionEntitySchema = TransactionEntitySchema.required({ transferDirection: true }).extend({
    type: literal(TransactionTypeEnum.TRANSFER)
});
