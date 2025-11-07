import { ExpenseTransactionEntitySchema } from './expense-transaction-entity.schema';
import { convertToCreateEntitySchema } from '../../../generic/util/convert-to-create-entity-schema.util';

export const ExpenseTransactionCreateEntitySchema = convertToCreateEntitySchema(ExpenseTransactionEntitySchema).partial({
    comment: true,
    operatedAt: true
});
