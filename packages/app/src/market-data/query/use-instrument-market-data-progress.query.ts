import {
    InstrumentDailyMarketPriceEntityTable,
    InstrumentDailyMarketPriceRepository,
    InstrumentMarketDataJobEntityTable,
    InstrumentMarketDataJobRepository,
    InstrumentMarketDataJobStatusEnum
} from '@budgie/contracts';
import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';
import { parseISO } from 'date-fns/parseISO';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

const FULL_PERCENT = 100;

const latestMarketDataJobAtom = databaseQueryFamily(
    [InstrumentMarketDataJobEntityTable],
    InstrumentMarketDataJobRepository,
    (instrumentMarketDataJobRepository, [instrumentId, quoteInstrumentId]: readonly [number, number]) =>
        instrumentMarketDataJobRepository.findLatestByInstrumentAndQuote(instrumentId, quoteInstrumentId)
);

const marketPriceCountAtom = databaseQueryFamily(
    [InstrumentDailyMarketPriceEntityTable],
    InstrumentDailyMarketPriceRepository,
    (instrumentDailyMarketPriceRepository, [instrumentId, quoteInstrumentId]: readonly [number, number]) =>
        instrumentDailyMarketPriceRepository.countByInstrumentAndQuote(instrumentId, quoteInstrumentId)
);

export const useInstrumentMarketDataProgressQuery = (instrumentId: number, quoteInstrumentId: number) => {
    const job = AsyncResult.getOrElse(useLiveAtomValue(latestMarketDataJobAtom([instrumentId, quoteInstrumentId])), () => null);
    const countRows = AsyncResult.getOrElse(useLiveAtomValue(marketPriceCountAtom([instrumentId, quoteInstrumentId])), () => []);

    const loadedDays = countRows.at(0)?.count ?? 0;
    let totalDays = loadedDays;

    if (isDefined(job)) {
        const jobDays = differenceInCalendarDays(parseISO(job.toDate), parseISO(job.fromDate)) + 1;

        if (isPositiveNumber(jobDays)) {
            totalDays = Math.max(jobDays, loadedDays);
        }
    }

    const boundedLoadedDays = Math.min(loadedDays, totalDays);
    const percent = isPositiveNumber(totalDays) ? Math.round((boundedLoadedDays / totalDays) * FULL_PERCENT) : 0;
    const isComplete = job?.status === InstrumentMarketDataJobStatusEnum.COMPLETED || percent >= FULL_PERCENT;

    return {
        loadedDays: boundedLoadedDays,
        percent,
        status: job?.status ?? null,
        totalDays,
        isComplete
    };
};
