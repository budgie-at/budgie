import { literal } from 'zod';

import { TransactionTypeEnum } from '../../enum/transaction-type.enum';
import { TransactionEntitySchema } from '../transaction-entity.schema';

export const IncomeAssetTransactionEntitySchema = TransactionEntitySchema.extend({
    type: literal(TransactionTypeEnum.INCOME)
});
