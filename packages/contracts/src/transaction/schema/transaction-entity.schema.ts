import { createSelectSchema } from 'drizzle-zod';
import { number , enum as zodEnum } from 'zod';

import { ExternalSourceEnum } from '../../account/enum/external-source.enum';
import { BaseEntityFields } from '../../generic/constant/base-entity-fields.constant';
import { TRANSACTION_COMMENT_MAX_LENGTH } from '../constant/transaction-comment-max-length.constant';
import { TRANSACTION_TITLE_MAX_LENGTH } from '../constant/transaction-title-max-length.constant';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';
import { TransactionEntityTable } from '../table/transaction-entity.table';

export const TransactionEntitySchema = createSelectSchema(TransactionEntityTable, {
    ...BaseEntityFields,
    title: schema => schema.max(TRANSACTION_TITLE_MAX_LENGTH).describe('Title of the entry'),
    comment: schema => schema.max(TRANSACTION_COMMENT_MAX_LENGTH).describe('Comment of the entry'),
    amount: number().describe('Amount of the transaction.'),
    type: zodEnum(TransactionTypeEnum).describe('The type of the transaction.'),
    externalId: schema => schema.describe('The external id of the transaction.'),
    operatedAt: schema => schema.describe('The date when the transaction was operated.'),
    exchangeRate: schema => schema.positive().describe('The exchange rate of the transaction.'),
    externalSource: zodEnum(ExternalSourceEnum).nullable().describe('The external source of the transaction.'),
    toAccountId: schema => schema.positive().nullable().describe('The id of the account the transaction is sent to.'),
    fromAccountId: schema => schema.positive().nullable().describe('The id of the account the transaction is received from.'),
});
