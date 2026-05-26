import { createSelectSchema } from 'drizzle-zod';
import { number, enum as zodEnum } from 'zod';

import { BaseEntityFields } from '../../@generic/constant/base-entity-fields.constant';
import { CategorySourceEnum } from '../enum/category-source.enum';
import { TransactionEntryTypeEnum } from '../enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../table/transaction-entry-entity.table';

export const TransactionEntryEntitySchema = createSelectSchema(TransactionEntryEntityTable, {
    ...BaseEntityFields,
    transactionId: schema => schema.positive().describe('Id of the transaction the entry belongs to'),
    accountId: schema => schema.positive().describe('Id of the account the entry belongs to'),
    categoryId: schema => schema.positive().nullable().describe('Id of the category the entry belongs to'),
    categorySource: zodEnum(CategorySourceEnum).describe('Source that assigned the categoryId'),
    mccCategoryId: schema => schema.positive().nullable().describe('Id of the MCC category the entry belongs to'),
    type: zodEnum(TransactionEntryTypeEnum).describe('Type of the entry'),
    amount: number().positive().describe('Amount of the entry'),
    externalId: schema => schema.nullable().default(null).describe('External id of the entry'),
    exchangeRate: schema =>
        schema.positive().default(1).describe('Exchange rate for this entry, defaults to 1 for same-currency transactions'),
    baseInstrumentId: schema => schema.positive().nullable().describe('Id of the base instrument used for analytics valuation'),
    baseExchangeRate: schema => schema.positive().nullable().describe('Exchange rate used to value this entry in the base instrument'),
    baseAmount: schema => schema.positive().nullable().describe('Amount of this entry valued in the base instrument'),
    toIban: schema => schema.max(34).nullable().default(null).describe('Counter-party IBAN, max 34 chars per ISO 13616'),
    originalTransactionId: schema => schema.positive().nullable().describe('Original transaction id for moved consolidation source entries')
});
