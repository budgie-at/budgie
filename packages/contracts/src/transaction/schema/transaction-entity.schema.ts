import { createSelectSchema } from 'drizzle-zod';
import { enum as zodEnum } from 'zod';

import { BaseEntityFields } from '../../generic/constant/base-entity-fields.constant';
import { TRANSACTION_TITLE_MAX_LENGTH } from '../constant/transaction-title-max-length.constant';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';
import { TransactionEntityTable } from '../table/transaction-entity.table';

export const TransactionEntitySchema = createSelectSchema(TransactionEntityTable, {
    ...BaseEntityFields,
    type: zodEnum(TransactionTypeEnum).describe('The transaction type.'),
    title: schema => schema.max(TRANSACTION_TITLE_MAX_LENGTH).describe('The transaction title.'),
    comment: schema => schema.describe('The transaction comment.'),
    operatedAt: schema => schema.describe('The transaction operated at.'),
    accountId: schema => schema.describe('The id of the account transaction belongs to.'),
    categoryId: schema => schema.describe('The id of the category transaction belongs to.')
});
