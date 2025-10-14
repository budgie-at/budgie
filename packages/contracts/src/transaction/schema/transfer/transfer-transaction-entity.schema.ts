import { array, literal } from 'zod';

import { MoneyTransactionLineEntitySchema } from '../../../transaction-line/schema/money/money-transaction-line-entity.schema';
import { TransactionTypeEnum } from '../../enum/transaction-type.enum';
import { TransactionEntitySchema } from '../transaction-entity.schema';

export const TransferTransactionEntitySchema = TransactionEntitySchema.omit({
    lines: true,
    type: true
}).extend({
    type: literal(TransactionTypeEnum.TRANSFER),
    lines: array(MoneyTransactionLineEntitySchema).length(2).describe('Lines associated with the money-transfer transaction.')
});
