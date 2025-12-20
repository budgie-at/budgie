import { isDefined } from '@rnw-community/shared';

import { TransactionAssociationEnum } from '../enum/transaction-association.enum';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';

import { TransactionCreateEntitySchema } from './transaction-create-entity.schema';

export const TransferTransactionCreateEntitySchema = TransactionCreateEntitySchema.superRefine(
    ({ fromAccountId, toAccountId, type }, context) => {
        if (type !== TransactionTypeEnum.TRANSFER) {
            context.addIssue({
                code: 'custom',
                path: ['type'],
                message: `Transaction type must be '${TransactionTypeEnum.TRANSFER}'.`
            });
        }

        if (!isDefined(fromAccountId) || !isDefined(toAccountId)) {
            context.addIssue({
                code: 'custom',
                path: [TransactionAssociationEnum.ENTRIES],
                message: '"from" and "to" accounts must be defined'
            });
        }

        if (fromAccountId === toAccountId) {
            context.addIssue({
                code: 'custom',
                path: [TransactionAssociationEnum.ENTRIES],
                message: '"from" and "to" accounts must be different'
            });
        }
    }
);
