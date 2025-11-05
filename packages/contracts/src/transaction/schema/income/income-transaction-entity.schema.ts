import { literal } from 'zod';

import { TransactionTypeEnum } from '../../enum/transaction-type.enum';
import { TransactionEntitySchema } from '../transaction-entity.schema';

export const IncomeTransactionEntitySchema = TransactionEntitySchema.omit({
    type: true,
    quantity: true,
    instrument: true,
    pricePerUnit: true,
    counterAccountId: true,
    transferDirection: true
})
    .extend({
        type: literal(TransactionTypeEnum.INCOME)
    })
    .required({
        categoryId: true
    });
