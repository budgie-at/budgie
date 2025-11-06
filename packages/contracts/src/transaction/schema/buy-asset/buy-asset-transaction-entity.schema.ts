import { literal } from 'zod';

import { TransactionTypeEnum } from '../../enum/transaction-type.enum';
import { TransactionEntitySchema } from '../transaction-entity.schema';

export const BuyAssetTransactionEntitySchema = TransactionEntitySchema.omit({
    type: true
})
    .extend({
        type: literal(TransactionTypeEnum.TRANSFER)
    })
    .required({
        amount: true,
        quantity: true,
        instrument: true,
        toAccountId: true,
        pricePerUnit: true,
        fromAccountId: true
    });
