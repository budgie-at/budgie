import { IncomeAssetTransactionEntitySchema } from './income-asset-transaction-entity.schema';

export const IncomeAssetTransactionCreateEntitySchema = IncomeAssetTransactionEntitySchema.pick({
    type: true
});
