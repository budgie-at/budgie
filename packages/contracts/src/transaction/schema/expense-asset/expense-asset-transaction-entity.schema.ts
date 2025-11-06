import { literal } from 'zod';

import { TransactionTypeEnum } from '../../enum/transaction-type.enum';
import { TransactionEntitySchema } from '../transaction-entity.schema';

export const ExpenseAssetTransactionEntitySchema = TransactionEntitySchema.omit({
    type: true,
    amount: true
})
    .extend({
        type: literal(TransactionTypeEnum.EXPENSE)
    })
    .required({
        quantity: true,
        instrument: true,
        pricePerUnit: true,
        fromAccountId: true
    });
