import { TransactionTypeEnum } from '../enum/transaction-type.enum';

import { TransactionCreateEntitySchema } from './transaction-create-entity.schema';

export const IncomeTransactionCreateEntitySchema = TransactionCreateEntitySchema.superRefine(({ type }, context) => {
    if (type !== TransactionTypeEnum.INCOME) {
        context.addIssue({
            code: 'custom',
            path: ['type'],
            message: `Transaction type must be '${TransactionTypeEnum.INCOME}'.`
        });
    }
});
