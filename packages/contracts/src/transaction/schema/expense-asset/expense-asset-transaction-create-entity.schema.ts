import { ExpenseAssetTransactionEntitySchema } from './expense-asset-transaction-entity.schema';
import { convertToCreateEntitySchema } from '../../../generic/util/convert-to-create-entity-schema.util';

export const ExpenseAssetTransactionCreateEntitySchema = convertToCreateEntitySchema(ExpenseAssetTransactionEntitySchema).partial({
    comment: true,
    operatedAt: true
});
