import { literal } from 'zod';

import { TransactionTypeEnum } from '../../enum/transaction-type.enum';
import { TransactionEntitySchema } from '../transaction-entity.schema';

export const BaseTransferTransactionEntitySchema = TransactionEntitySchema.omit({
    type: true
})
    .extend({
        type: literal(TransactionTypeEnum.TRANSFER)
    })
    .required({
        categoryId: true,
        fromAccountId: true
    });
