import { InstrumentMarketDataJobEntityTable } from '@budgie/contracts';
import { InstrumentMarketDataJobRepository } from '@budgie/market';

import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

export const yieldPriceJobsFamily = databaseQueryFamily(
    [InstrumentMarketDataJobEntityTable],
    InstrumentMarketDataJobRepository,
    (repository, instrumentIds: readonly number[]) => repository.hasActiveForInstruments(instrumentIds)
);
