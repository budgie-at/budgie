import { createSelectSchema } from 'drizzle-zod';
import { enum as zodEnum } from 'zod';

import { BaseEntityFields } from '../../@generic/constant/base-entity-fields.constant';
import { InstrumentMarketDataJobStatusEnum } from '../enum/instrument-market-data-job-status.enum';
import { InstrumentMarketDataJobEntityTable } from '../table/instrument-market-data-job-entity.table';

export const InstrumentMarketDataJobEntitySchema = createSelectSchema(InstrumentMarketDataJobEntityTable, {
    ...BaseEntityFields,
    instrumentId: schema => schema.positive().describe('Id of the instrument to load.'),
    quoteInstrumentId: schema => schema.positive().describe('Id of the quote instrument to load against.'),
    fromDate: schema => schema.describe('Inclusive historical data start date in YYYY-MM-DD format.'),
    toDate: schema => schema.describe('Inclusive historical data end date in YYYY-MM-DD format.'),
    status: zodEnum(InstrumentMarketDataJobStatusEnum).describe('Market data job status.'),
    priority: schema => schema.describe('Drain priority. Higher values run first.'),
    attempts: schema => schema.nonnegative().describe('Attempt count.'),
    lockedAt: schema => schema.nullable().describe('Time when the current drain attempt started.'),
    completedAt: schema => schema.nullable().describe('Time when the job completed.'),
    lastError: schema => schema.nullable().describe('Last job error message.')
});
