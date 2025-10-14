import { array } from 'zod';

import { TransactionLineCreateEntitySchema } from '../../../transaction-line/schema/transaction-line-create-entity.schema';
import { validateIncomeLines } from '../../../transaction-line/util/validate-income-lines.util';
import { BaseTransactionCreateEntityFieldsSchema } from '../base/base-transaction-create-entity-fields.schema';

import { IncomeTransactionEntitySchema } from './income-transaction-entity.schema';

export const IncomeTransactionCreateEntitySchema = IncomeTransactionEntitySchema.pick({ type: true })
    .extend({
        ...BaseTransactionCreateEntityFieldsSchema.shape,
        lines: array(TransactionLineCreateEntitySchema).min(1)
    })
    .superRefine(({ lines }, ctx) => {
        validateIncomeLines(lines, ctx);
    });
