import { convertToCreateEntitySchema } from '../../../generic/util/convert-to-create-entity-schema.util';

import { IncomeTransactionEntitySchema } from './income-transaction-entity.schema';

export const IncomeTransactionCreateEntitySchema = convertToCreateEntitySchema(IncomeTransactionEntitySchema).partial({
    comment: true,
    operatedAt: true
});
