import { array } from 'zod';

import { convertToCreateEntitySchema } from '../../generic/util/convert-to-create-entity-schema.util';
import { TransactionEntryCreateEntitySchema } from '../../transaction-entry/schema/transaction-entry-create-entity.schema';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

import { TransferTransactionEntitySchema } from './transfer-transaction-entity.schema';

export const BaseTransferTransactionCreateEntitySchema = convertToCreateEntitySchema(TransferTransactionEntitySchema).extend({
    [TransactionAssociationEnum.ENTRIES]: array(TransactionEntryCreateEntitySchema).min(2)
});
