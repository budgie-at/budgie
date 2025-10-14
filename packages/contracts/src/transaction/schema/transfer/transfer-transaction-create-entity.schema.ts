import { array } from 'zod';

import { TransactionLineCreateEntitySchema } from '../../../transaction-line/schema/transaction-line-create-entity.schema';
import { validateMoneyTransferLines } from '../../../transaction-line/util/validate-money-transfer-lines.util';
import { BaseTransactionCreateEntitySchema } from '../base/base-transaction-create-entity.schema';

import { TransferTransactionEntitySchema } from './transfer-transaction-entity.schema';

export const TransferTransactionCreateEntitySchema = TransferTransactionEntitySchema.pick({ type: true })
    .extend({
        ...BaseTransactionCreateEntitySchema.shape,
        lines: array(TransactionLineCreateEntitySchema).length(1)
    })
    .superRefine(({ lines }, ctx) => {
        validateMoneyTransferLines(lines, ctx);
    });
