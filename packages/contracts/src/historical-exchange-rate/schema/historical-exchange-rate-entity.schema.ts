import { createSelectSchema } from 'drizzle-zod';

import { BaseEntityFields } from '../../@generic/constant/base-entity-fields.constant';
import { HistoricalExchangeRateEntityTable } from '../table/historical-exchange-rate-entity.table';

export const HistoricalExchangeRateEntitySchema = createSelectSchema(HistoricalExchangeRateEntityTable, {
    ...BaseEntityFields,
    sourceInstrumentId: schema => schema.positive().describe('Id of the source instrument.'),
    targetInstrumentId: schema => schema.positive().describe('Id of the target instrument.'),
    rateDate: schema => schema.describe('Historical rate date in YYYY-MM-DD format.'),
    rate: schema => schema.positive().describe('Exchange rate from source instrument to target instrument.')
});
