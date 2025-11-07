import { convertToCreateEntitySchema } from '../../../generic/util/convert-to-create-entity-schema.util';

import { TransferAssetTransactionEntitySchema } from './transfer-asset-transaction-entity.schema';

export const TransferAssetTransactionCreateEntitySchema = convertToCreateEntitySchema(TransferAssetTransactionEntitySchema).partial({
    comment: true,
    operatedAt: true
});
