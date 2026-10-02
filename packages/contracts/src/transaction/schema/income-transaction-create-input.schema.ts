import * as Schema from 'effect/Schema';

import { TransactionTypeEnum } from '../enum/transaction-type.enum';

import { TransactionCreateInputSchema } from './transaction-create-input.schema';

export const IncomeTransactionCreateInputSchema = TransactionCreateInputSchema.check(
    Schema.makeFilter(
        ({ type }) =>
            type === TransactionTypeEnum.INCOME || { path: ['type'], issue: `Transaction type must be '${TransactionTypeEnum.INCOME}'.` }
    )
);
