import { literal } from 'zod';

import { TransactionTypeEnum } from '../../enum/transaction-type.enum';
import { TransactionEntitySchema } from '../transaction-entity.schema';

export const TransferAssetTransactionEntitySchema = TransactionEntitySchema.omit({ type: true, amount: true, pricePerUnit: true })
    .extend({
        type: literal(TransactionTypeEnum.TRANSFER)
    })
    .required({
        quantity: true,
        instrument: true,
        toAccountId: true,
        fromAccountId: true
    });
