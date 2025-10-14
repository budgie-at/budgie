import { array } from 'zod';

import { TransactionLineCreateEntitySchema } from '../../../transaction-line/schema/transaction-line-create-entity.schema';
import { validateExpenseLines } from '../../../transaction-line/util/validate-expense-lines.util';
import { BaseTransactionCreateEntitySchema } from '../base/base-transaction-create-entity.schema';

import { ExpenseTransactionEntitySchema } from './expense-transaction-entity.schema';

export const ExpenseTransactionCreateEntitySchema = ExpenseTransactionEntitySchema.pick({ type: true })
    .extend({
        ...BaseTransactionCreateEntitySchema.shape,
        lines: array(TransactionLineCreateEntitySchema).min(1)
    })
    .superRefine(({ lines }, ctx) => {
        validateExpenseLines(lines, ctx);
    });
