import { convertToCreateEntitySchema } from '../../../generic/util/convert-to-create-entity-schema.util';

import { IncomeAssetTransactionEntitySchema } from './income-asset-transaction-entity.schema';

export const IncomeAssetTransactionCreateEntitySchema = convertToCreateEntitySchema(IncomeAssetTransactionEntitySchema).partial({
    comment: true,
    operatedAt: true
});
