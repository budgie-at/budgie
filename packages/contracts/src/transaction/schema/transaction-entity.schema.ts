import { createSelectSchema } from 'drizzle-zod';
import { enum as zodEnum } from 'zod';

import { BaseEntityFields } from '../../generic/constant/base-entity-fields.constant';
import { TRANSACTION_COMMENT_MAX_LENGTH } from '../constant/transaction-comment-max-length.constant';
import { TRANSACTION_TITLE_MAX_LENGTH } from '../constant/transaction-title-max-length.constant';
import { TransactionTransferDirectionEnum } from '../enum/transaction-transfer-direction.enum';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';
import { TransactionEntityTable } from '../table/transaction-entity.table';

export const TransactionEntitySchema = createSelectSchema(TransactionEntityTable, {
    ...BaseEntityFields,
    amount: schema => schema.default(0).describe('The transaction amount.'),
    type: zodEnum(TransactionTypeEnum).describe('The transaction type.'),
    pricePerUnit: schema => schema.default(0).describe('The transaction price per unit.'),
    quantity: schema => schema.default(0).describe('The transaction holding quantity.'),
    title: schema => schema.max(TRANSACTION_TITLE_MAX_LENGTH).describe('The transaction title.'),
    comment: schema => schema.max(TRANSACTION_COMMENT_MAX_LENGTH).describe('The transaction comment.'),
    operatedAt: schema => schema.describe('The transaction operated at.'),
    accountId: schema => schema.describe('The id of the account transaction belongs to.'),
    counterAccountId: schema => schema.optional().describe('The id of the counter account transaction belongs to.'),
    instrument: schema => schema.nullable().describe('The instrument transaction belongs to.'),
    categoryId: schema => schema.positive().nullable().describe('The id of the category transaction belongs to.'),
    transferDirection: zodEnum(TransactionTransferDirectionEnum)
        .default(TransactionTransferDirectionEnum.IN)
        .optional()
        .describe('The transaction transfer direction.')
});
