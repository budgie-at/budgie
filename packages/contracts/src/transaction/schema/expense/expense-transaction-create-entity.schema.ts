import { convertToCreateEntitySchema } from '../../../generic/util/convert-to-create-entity-schema.util';

import { ExpenseTransactionEntitySchema } from './expense-transaction-entity.schema';

export const ExpenseTransactionCreateEntitySchema = convertToCreateEntitySchema(ExpenseTransactionEntitySchema).partial({
    comment: true,
    operatedAt: true
});
