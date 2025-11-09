import { array } from 'zod';

import { convertToCreateEntitySchema } from '../../generic/util/convert-to-create-entity-schema.util';
import { TransactionEntryCreateEntitySchema } from '../../transaction-entry/schema/transaction-entry-create-entity.schema';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';
import { transferTransactionRefine } from '../refines/transfer-transaction.refine';

import { TransferTransactionEntitySchema } from './transfer-transaction-entity.schema';

export const TransferAssetTransactionCreateEntitySchema = convertToCreateEntitySchema(TransferTransactionEntitySchema)
    .extend({ [TransactionAssociationEnum.ENTRIES]: array(TransactionEntryCreateEntitySchema).min(2) })
    .superRefine((transaction, context) => {
        transferTransactionRefine(transaction, context, {
            sameAccount: false,
            sameInstrument: true,
            stableExchangeRate: true
        });
    });
