import { InstrumentMarketDataJobStatusEnum } from '@budgie/contracts';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { instrumentDailyMarketPriceRepository, instrumentMarketDataJobRepository } from '../../@generic/drizzle/db/db';

const FULL_PERCENT = 100;

export const useInstrumentMarketDataProgressQuery = (instrumentId: number, quoteInstrumentId: number) => {
    const dependencies = [instrumentId, quoteInstrumentId];
    const { data: job } = useLiveQuery(
        instrumentMarketDataJobRepository.findLatestByInstrumentAndQuote(instrumentId, quoteInstrumentId),
        dependencies
    );
    const { data: countRows } = useLiveQuery(
        instrumentDailyMarketPriceRepository.countByInstrumentAndQuote(instrumentId, quoteInstrumentId),
        dependencies
    );

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
