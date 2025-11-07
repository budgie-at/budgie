import { BuyAssetTransactionEntitySchema } from './buy-asset-transaction-entity.schema';
import { convertToCreateEntitySchema } from '../../../generic/util/convert-to-create-entity-schema.util';

export const BuyAssetTransactionCreateEntitySchema = convertToCreateEntitySchema(BuyAssetTransactionEntitySchema).partial({
    comment: true,
    operatedAt: true
});
