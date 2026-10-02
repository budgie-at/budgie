import * as Schema from 'effect/Schema';

import { TransactionTypeEnum } from '../enum/transaction-type.enum';

import { TransactionCreateInputSchema } from './transaction-create-input.schema';

export const ExpenseTransactionCreateInputSchema = TransactionCreateInputSchema.check(
    Schema.makeFilter(
        ({ type }) =>
            type === TransactionTypeEnum.EXPENSE || { path: ['type'], issue: `Transaction type must be '${TransactionTypeEnum.EXPENSE}'.` }
    )
);
