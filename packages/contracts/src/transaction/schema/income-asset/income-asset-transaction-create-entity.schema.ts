import { IncomeAssetTransactionEntitySchema } from './income-asset-transaction-entity.schema';
import { convertToCreateEntitySchema } from '../../../generic/util/convert-to-create-entity-schema.util';

export const IncomeAssetTransactionCreateEntitySchema = convertToCreateEntitySchema(IncomeAssetTransactionEntitySchema).partial({
    comment: true,
    operatedAt: true
});
