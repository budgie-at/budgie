import { createSelectSchema } from 'drizzle-zod';
import { number, enum as zodEnum } from 'zod';

import { BaseEntityFields } from '../../generic/constant/base-entity-fields.constant';
import { TransactionEntryTypeEnum } from '../enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../table/transaction-entry-entity.table';

export const TransactionEntryEntitySchema = createSelectSchema(TransactionEntryEntityTable, {
    ...BaseEntityFields,
    transactionId: schema => schema.positive().describe('Id of the transaction the entry belongs to'),
    accountId: schema => schema.positive().describe('Id of the account the entry belongs to'),
    categoryId: schema => schema.positive().nullable().describe('Id of the category the entry belongs to'),
    instrumentId: schema => schema.positive().describe('Id of the instrument the entry belongs to'),
    type: zodEnum(TransactionEntryTypeEnum).describe('Type of the entry'),
    amount: number().positive().describe('Amount of the entry')
});
