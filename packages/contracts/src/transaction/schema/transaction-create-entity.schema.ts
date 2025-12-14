import { array, number } from 'zod';

import { convertToCreateEntitySchema } from '../../generic/util/convert-to-create-entity-schema.util';
import { TransactionEntryCreateEntitySchema } from '../../transaction-entry/schema/transaction-entry-create-entity.schema';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

import { TransactionEntitySchema } from './transaction-entity.schema';

export const TransactionCreateEntitySchema = convertToCreateEntitySchema(TransactionEntitySchema)
    .extend({
        tagIds: number().array().describe('Array of tag IDs associated with the transaction'),
        [TransactionAssociationEnum.ENTRIES]: array(TransactionEntryCreateEntitySchema.omit({ transactionId: true })).min(1)
    })
    .superRefine(({ amount, entries }, context) => {
        if (amount === 0) {
            context.addIssue({
                code: 'custom',
                path: ['amount'],
                message: 'Amount must not be equal to 0.'
            });
        }

        const totalAmount = entries.reduce((acc, curr) => acc + curr.amount, 0);

        if (totalAmount !== amount) {
            context.addIssue({
                code: 'custom',
                path: [TransactionAssociationEnum.ENTRIES],
                message: `Total amount of transaction entries (${totalAmount}) does not match the transaction amount (${amount}).`
            });
        }
    });
