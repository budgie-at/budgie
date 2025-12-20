import { createSelectSchema } from 'drizzle-zod';

import { BaseEntityFields } from '../../generic/constant/base-entity-fields.constant';
import { ExchangeRateEntityTable } from '../table/exchange-rate-entity.table';

export const ExchangeRateEntitySchema = createSelectSchema(ExchangeRateEntityTable, {
    ...BaseEntityFields,
    source: schema => schema.describe('The source of the exchange rate.'),
    baseInstrumentId: schema => schema.describe('The id of the base instrument.'),
    quoteInstrumentId: schema => schema.describe('The id of the quote instrument.'),
    rate: schema => schema.describe('The exchange rate.')
});
