import { array, literal } from 'zod';

import { MoneyTransactionLineEntitySchema } from '../../../transaction-line/schema/money/money-transaction-line-entity.schema';
import { validateExpenseLines } from '../../../transaction-line/util/validate-expense-lines.util';
import { validateLineLinkageToTransaction } from '../../../transaction-line/util/validate-line-linked-to-transaction.util';
import { TransactionTypeEnum } from '../../enum/transaction-type.enum';
import { TransactionEntitySchema } from '../transaction-entity.schema';

export const ExpenseTransactionEntitySchema = TransactionEntitySchema.omit({
    lines: true,
    type: true
})
    .extend({
        type: literal(TransactionTypeEnum.EXPENSE),
        lines: array(MoneyTransactionLineEntitySchema).min(1).describe('Lines associated with the expense transaction.')
    })
    .superRefine(({ id, lines }, ctx) => {
        validateLineLinkageToTransaction(id, lines, ctx);
        validateExpenseLines(lines, ctx);
    });
