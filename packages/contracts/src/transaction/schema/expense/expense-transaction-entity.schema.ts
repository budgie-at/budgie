import { literal } from 'zod';

import { TransactionTypeEnum } from '../../enum/transaction-type.enum';
import { TransactionEntitySchema } from '../transaction-entity.schema';

export const ExpenseTransactionEntitySchema = TransactionEntitySchema.omit({
    type: true,
    quantity: true,
    instrument: true,
    toAccountId: true,
    pricePerUnit: true
})
    .extend({
        type: literal(TransactionTypeEnum.EXPENSE)
    })
    .required({
        amount: true,
        categoryId: true,
        fromAccountId: true
    });
