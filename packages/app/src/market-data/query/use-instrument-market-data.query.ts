import { InstrumentDailyMarketPriceEntityTable } from '@budgie/contracts';
import { InstrumentDailyMarketPriceRepository } from '@budgie/market';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

const MARKET_DATA_HISTORY_LIMIT = 366;

export const recentMarketPricesAtom = databaseQueryFamily(
    [InstrumentDailyMarketPriceEntityTable],
    InstrumentDailyMarketPriceRepository,
    (instrumentDailyMarketPriceRepository, [instrumentId, quoteInstrumentId]: readonly [number, number]) =>
        instrumentDailyMarketPriceRepository
            .findRecent(instrumentId, quoteInstrumentId, MARKET_DATA_HISTORY_LIMIT)
            .pipe(Effect.map(prices => [...prices].reverse()))
);

export const useInstrumentMarketDataQuery = (instrumentId: number, quoteInstrumentId: number) => {
    const prices = AsyncResult.getOrElse(useLiveAtomValue(recentMarketPricesAtom([instrumentId, quoteInstrumentId])), () => []);

    return {
        latestPrice: prices.at(-1),
        previousPrice: prices.at(-2),
        prices
    };
};
