import { createSelectSchema } from 'drizzle-zod';
import { enum as zodEnum } from 'zod';

import { BaseEntityFields } from '../../generic/constant/base-entity-fields.constant';
import { TransactionEntryTypeEnum } from '../enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../table/transaction-entry-entity.table';

export const TransactionEntryEntitySchema = createSelectSchema(TransactionEntryEntityTable, {
    ...BaseEntityFields,
    transactionId: schema => schema.describe('Id of the transaction the entry belongs to'),
    accountId: schema => schema.describe('Id of the account the entry belongs to'),
    categoryId: schema => schema.describe('Id of the category the entry belongs to'),
    parentCategoryId: schema => schema.describe('Id of the parent category the entry belongs to'),
    instrumentId: schema => schema.describe('Id of the instrument the entry belongs to'),
    parentAccountId: schema => schema.describe('Id of the parent-account the entry belongs to'),
    type: zodEnum(TransactionEntryTypeEnum).describe('Type of the entry'),
    amount: schema => schema.describe('Amount of the entry')
});
