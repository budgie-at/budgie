import { InstrumentMarketDataJobEntityTable } from '@budgie/contracts';
import { InstrumentMarketDataJobRepository } from '@budgie/market';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';

import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

const MAX_JOB_ATTEMPTS = 3;
const STALE_LOCK_MS = 5 * 60 * 1000;

export const yieldPriceJobsFamily = databaseQueryFamily(
    [InstrumentMarketDataJobEntityTable],
    InstrumentMarketDataJobRepository,
    (repository, instrumentIds: readonly number[]) =>
        Effect.flatMap(DateTime.now, now =>
            repository.hasActiveForInstruments(
                instrumentIds,
                MAX_JOB_ATTEMPTS,
                DateTime.toDateUtc(DateTime.subtractDuration(now, STALE_LOCK_MS))
            )
        )
);
