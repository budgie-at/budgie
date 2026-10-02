import * as Schema from 'effect/Schema';

import { isDefined } from '@rnw-community/shared';

import { TransactionTypeEnum } from '../enum/transaction-type.enum';

import { TransactionCreateInputSchema } from './transaction-create-input.schema';

export const TransferTransactionCreateInputSchema = TransactionCreateInputSchema.check(
    Schema.makeFilter(({ fromAccountId, toAccountId, type }) => [
        ...(type === TransactionTypeEnum.TRANSFER
            ? []
            : [{ path: ['type'], issue: `Transaction type must be '${TransactionTypeEnum.TRANSFER}'.` }]),
        ...(isDefined(fromAccountId) ? [] : [{ path: ['fromAccountId'], issue: '"from" account must be defined' }]),
        ...(isDefined(fromAccountId) && !isDefined(toAccountId) ? [{ path: ['toAccountId'], issue: '"to" accounts must be defined' }] : []),
        ...(isDefined(fromAccountId) && fromAccountId === toAccountId
            ? [{ path: ['fromAccountId', 'toAccountId'], issue: '"from" and "to" accounts must be different' }]
            : [])
    ])
);
