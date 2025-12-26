import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';

import { TransactionCreateEntitySchema } from './transaction-create-entity.schema';

export const IncomeTransactionCreateEntitySchema = TransactionCreateEntitySchema.superRefine(({ entries, type }, context) => {
    if (type !== TransactionTypeEnum.INCOME) {
        context.addIssue({
            code: 'custom',
            path: ['type'],
            message: `Transaction type must be '${TransactionTypeEnum.INCOME}'.`
        });
    }

    entries.forEach((transactionEntry, entryIndex) => {
        if (transactionEntry.type !== TransactionEntryTypeEnum.CREDIT) {
            context.addIssue({
                code: 'custom',
                path: [TransactionAssociationEnum.ENTRIES, entryIndex, 'type'],
                message: "income entry must be 'credit' (inflow)."
            });
        }
    });
});
