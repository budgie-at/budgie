import { literal } from 'zod';

import { TransactionTypeEnum } from '../../enum/transaction-type.enum';
import { TransactionEntitySchema } from '../transaction-entity.schema';

export const ExpenseAssetTransactionEntitySchema = TransactionEntitySchema.required({ instrument: true }).extend({
    type: literal(TransactionTypeEnum.EXPENSE)
});
