import { literal } from 'zod';

import { TransactionTypeEnum } from '../../enum/transaction-type.enum';
import { TransactionEntitySchema } from '../transaction-entity.schema';

export const ExpenseTransactionEntitySchema = TransactionEntitySchema.extend({
    type: literal(TransactionTypeEnum.EXPENSE)
});
