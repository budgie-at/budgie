import { TransactionTypeEnum } from '../enum/transaction-type.enum';

import { TransactionCreateEntitySchema } from './transaction-create-entity.schema';

export const ExpenseTransactionCreateEntitySchema = TransactionCreateEntitySchema.superRefine(({ type }, context) => {
    if (type !== TransactionTypeEnum.EXPENSE) {
        context.addIssue({
            code: 'custom',
            path: ['type'],
            message: `Transaction type must be '${TransactionTypeEnum.EXPENSE}'.`
        });
    }
});
