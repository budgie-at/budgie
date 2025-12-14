import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';

import { TransactionCreateEntitySchema } from './transaction-create-entity.schema';

export const ExpenseTransactionCreateEntitySchema = TransactionCreateEntitySchema.superRefine(({ entries, type }, context) => {
    if (type !== TransactionTypeEnum.EXPENSE) {
        context.addIssue({
            code: 'custom',
            path: ['type'],
            message: `Transaction type must be '${TransactionTypeEnum.EXPENSE}'.`
        });
    }

    entries.forEach((transactionEntry, entryIndex) => {
        if (transactionEntry.type !== TransactionEntryTypeEnum.CREDIT) {
            context.addIssue({
                code: 'custom',
                path: [TransactionAssociationEnum.ENTRIES, entryIndex, 'type'],
                message: "expense entry must be 'credit' (outflow)."
            });
        }
    });
});
