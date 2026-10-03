import { InstrumentDailyMarketPriceEntityTable } from '@budgie/contracts';
import { InstrumentDailyMarketPriceRepository } from '@budgie/market';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

const MARKET_DATA_HISTORY_LIMIT = 90;

const recentMarketPricesAtom = databaseQueryFamily(
    [InstrumentDailyMarketPriceEntityTable],
    InstrumentDailyMarketPriceRepository,
    (instrumentDailyMarketPriceRepository, [instrumentId, quoteInstrumentId]: readonly [number, number]) =>
        instrumentDailyMarketPriceRepository.findRecent(instrumentId, quoteInstrumentId, MARKET_DATA_HISTORY_LIMIT)
);

export const useInstrumentMarketDataQuery = (instrumentId: number, quoteInstrumentId: number) => {
    const prices = [
        ...AsyncResult.getOrElse(useLiveAtomValue(recentMarketPricesAtom([instrumentId, quoteInstrumentId])), () => [])
    ].reverse();

    return {
        latestPrice: prices.at(-1),
        previousPrice: prices.at(-2),
        prices
    };
};
