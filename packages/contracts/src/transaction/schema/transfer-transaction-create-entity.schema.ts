import { isDefined } from '@rnw-community/shared';

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

        if (!isDefined(fromAccountId)) {
            context.addIssue({
                code: 'custom',
                path: ['fromAccountId'],
                message: '"from" account must be defined'
            });

            return;
        }

        if (!isDefined(toAccountId)) {
            context.addIssue({
                code: 'custom',
                path: ['toAccountId'],
                message: '"to" account must be defined'
            });

            return;
        }

        if (fromAccountId === toAccountId) {
            context.addIssue({
                code: 'custom',
                path: ['fromAccountId', 'toAccountId'],
                message: '"from" and "to" accounts must be different'
            });
        }
    }
);
