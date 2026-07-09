import { createSelectSchema } from 'drizzle-zod';
import { number, enum as zodEnum } from 'zod';

import { BaseEntityFields } from '../../@generic/constant/base-entity-fields.constant';
import { DebtEventDirectionEnum } from '../enum/debt-event-direction.enum';
import { DebtEventSourceEnum } from '../enum/debt-event-source.enum';
import { DebtEventEntityTable } from '../table/debt-event-entity.table';

export const DebtEventEntitySchema = createSelectSchema(DebtEventEntityTable, {
    ...BaseEntityFields,
    debtAccountId: schema => schema.positive().describe('Id of the debt account this event belongs to'),
    transactionId: schema => schema.positive().nullable().describe('Id of the transaction that produced this debt event'),
    transactionEntryId: schema => schema.positive().nullable().describe('Id of the transaction entry that produced this debt event'),
    direction: zodEnum(DebtEventDirectionEnum).describe('Whether this event opens more debt principal or closes existing debt'),
    source: zodEnum(DebtEventSourceEnum).describe('Source flow that created the debt event'),
    amount: number().positive().describe('Debt event amount in the debt account instrument'),
    baseInstrumentId: schema => schema.positive().nullable().describe('Id of the base instrument used for analytics valuation'),
    baseExchangeRate: schema => schema.positive().nullable().describe('Exchange rate used to value this event in the base instrument'),
    baseAmount: schema => schema.positive().nullable().describe('Amount of this event valued in the base instrument'),
    operatedAt: schema => schema.describe('Date when the debt event happened')
});
