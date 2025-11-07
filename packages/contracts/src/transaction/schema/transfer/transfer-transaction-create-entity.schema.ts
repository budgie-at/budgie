import { convertToCreateEntitySchema } from '../../../generic/util/convert-to-create-entity-schema.util';

import { TransferTransactionEntitySchema } from './transfer-transaction-entity.schema';

export const TransferTransactionCreateEntitySchema = convertToCreateEntitySchema(TransferTransactionEntitySchema).partial({
    comment: true,
    operatedAt: true
});
