import { createSelectSchema } from 'drizzle-zod';

import { BaseEntityFields } from '../../generic/constant/base-entity-fields.constant';
import { TransactionEntryEntityTable } from '../table/transaction-entry-entity.table';

export const TransactionEntryEntitySchema = createSelectSchema(TransactionEntryEntityTable, {
    ...BaseEntityFields,
    title: schema => schema.describe('Title of the entry'),
    description: schema => schema.describe('Description of the entry'),
    transactionId: schema => schema.describe('Id of the transaction the entry belongs to'),
    accountId: schema => schema.describe('Id of the account the entry belongs to'),
    categoryId: schema => schema.describe('Id of the category the entry belongs to'),
    instrumentId: schema => schema.describe('Id of the instrument the entry belongs to'),
    parentAccountId: schema => schema.describe('Id of the parent-account the entry belongs to'),
    amount: schema => schema.describe('Amount of the entry')
});
