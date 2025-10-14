import { array, literal } from 'zod';

import { MoneyTransactionLineEntitySchema } from '../../../transaction-line/schema/money/money-transaction-line-entity.schema';
import { validateIncomeLines } from '../../../transaction-line/util/validate-income-lines.util';
import { validateLineLinkageToTransaction } from '../../../transaction-line/util/validate-line-linked-to-transaction.util';
import { TransactionTypeEnum } from '../../enum/transaction-type.enum';
import { TransactionEntitySchema } from '../transaction-entity.schema';

export const IncomeTransactionEntitySchema = TransactionEntitySchema.omit({
    lines: true,
    type: true
})
    .extend({
        type: literal(TransactionTypeEnum.INCOME),
        lines: array(MoneyTransactionLineEntitySchema).min(1).describe('Lines associated with the income transaction.')
    })
    .superRefine(({ id, lines }, ctx) => {
        validateLineLinkageToTransaction(id, lines, ctx);
        validateIncomeLines(lines, ctx);
    });
