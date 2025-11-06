import { literal } from 'zod';

import { TransactionTypeEnum } from '../../enum/transaction-type.enum';
import { TransactionEntitySchema } from '../transaction-entity.schema';

export const IncomeTransactionEntitySchema = TransactionEntitySchema.omit({
    type: true,
    quantity: true,
    instrument: true,
    pricePerUnit: true,
    fromAccountId: true
})
    .extend({
        type: literal(TransactionTypeEnum.INCOME)
    })
    .required({
        amount: true,
        categoryId: true,
        toAccountId: true
    });
