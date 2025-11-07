import { TransferTransactionEntitySchema } from './transfer-transaction-entity.schema';
import { convertToCreateEntitySchema } from '../../../generic/util/convert-to-create-entity-schema.util';

export const TransferTransactionCreateEntitySchema = convertToCreateEntitySchema(TransferTransactionEntitySchema).partial({
    comment: true,
    operatedAt: true
});
