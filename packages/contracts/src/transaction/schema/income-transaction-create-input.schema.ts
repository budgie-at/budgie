import { TransactionTypeEnum } from '../enum/transaction-type.enum';

import { TransactionCreateInputSchema } from './transaction-create-input.schema';

export const IncomeTransactionCreateInputSchema = TransactionCreateInputSchema.superRefine(({ type }, context) => {
    if (type !== TransactionTypeEnum.INCOME) {
        context.addIssue({
            code: 'custom',
            path: ['type'],
            message: `Transaction type must be '${TransactionTypeEnum.INCOME}'.`
        });
    }
});
