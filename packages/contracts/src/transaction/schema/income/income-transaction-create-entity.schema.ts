import { IncomeTransactionEntitySchema } from './income-transaction-entity.schema';
import { convertToCreateEntitySchema } from '../../../generic/util/convert-to-create-entity-schema.util';

export const IncomeTransactionCreateEntitySchema = convertToCreateEntitySchema(IncomeTransactionEntitySchema).partial({
    comment: true,
    operatedAt: true
});
