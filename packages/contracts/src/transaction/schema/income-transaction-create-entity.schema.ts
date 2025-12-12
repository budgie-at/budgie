import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';

import { TransactionCreateEntitySchema } from './transaction-create-entity.schema';

export const IncomeTransactionCreateEntitySchema = TransactionCreateEntitySchema.superRefine(({ entries, amount, type }, context) => {
    if (type !== TransactionTypeEnum.INCOME) {
        context.addIssue({
            code: 'custom',
            path: ['type'],
            message: `Transaction type must be '${TransactionTypeEnum.INCOME}'.`
        });
    }

    const totalAmount = entries.reduce((acc, curr) => acc + curr.amount, 0);

    if (totalAmount !== amount) {
        context.addIssue({
            code: 'custom',
            path: [TransactionAssociationEnum.ENTRIES],
            message: `Total amount of income entries (${totalAmount}) does not match the income amount (${amount}).`
        });
    }

    entries.forEach((transactionEntry, entryIndex) => {
        if (transactionEntry.type !== TransactionEntryTypeEnum.DEBIT) {
            context.addIssue({
                code: 'custom',
                path: [TransactionAssociationEnum.ENTRIES, entryIndex, 'type'],
                message: "income entry must be 'debit' (inflow)."
            });
        }
    });
});
