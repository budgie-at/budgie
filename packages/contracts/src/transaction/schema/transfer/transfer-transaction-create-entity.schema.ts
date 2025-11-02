import { BaseTransactionCreateEntityFieldsSchema } from '../base/base-transaction-create-entity-fields.schema';

import { TransferTransactionEntitySchema } from './transfer-transaction-entity.schema';

export const TransferTransactionCreateEntitySchema = TransferTransactionEntitySchema.pick({ type: true, transferDirection: true }).extend(
    BaseTransactionCreateEntityFieldsSchema.omit({ type: true }).shape
);
