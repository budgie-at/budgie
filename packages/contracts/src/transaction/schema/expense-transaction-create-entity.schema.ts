import { array } from 'zod';

import { convertToCreateEntitySchema } from '../../generic/util/convert-to-create-entity-schema.util';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionEntryCreateEntitySchema } from '../../transaction-entry/schema/transaction-entry-create-entity.schema';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

import { ExpenseTransactionEntitySchema } from './expense-transaction-entity.schema';

export const ExpenseTransactionCreateEntitySchema = convertToCreateEntitySchema(ExpenseTransactionEntitySchema)
    .extend({ [TransactionAssociationEnum.ENTRIES]: array(TransactionEntryCreateEntitySchema.omit({ transactionId: true })).min(1) })
    .superRefine(({ entries, amount }, context) => {
        const totalAmount = entries.reduce((acc, curr) => acc + curr.amount, 0);

        if (totalAmount !== amount) {
            context.addIssue({
                code: 'custom',
                path: [TransactionAssociationEnum.ENTRIES],
                message: `Total amount of expense entries (${totalAmount}) does not match the expense amount (${amount}).`
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
