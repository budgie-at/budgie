import { instrumentDailyMarketPriceRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseLiveQuery } from '../../@generic/hook/use-database-live-query.hook';

const MARKET_DATA_HISTORY_LIMIT = 90;

export const useInstrumentMarketDataQuery = (instrumentId: number, quoteInstrumentId: number) => {
    const dependencies = [instrumentId, quoteInstrumentId];
    const { data, updatedAt, ...rest } = useDatabaseLiveQuery(
        instrumentDailyMarketPriceRepository.findRecent(instrumentId, quoteInstrumentId, MARKET_DATA_HISTORY_LIMIT),
        dependencies
    );

    const prices = [...data].reverse();
    const latestPrice = prices.at(-1);
    const previousPrice = prices.at(-2);

    return {
        latestPrice,
        previousPrice,
        prices,
        updatedAt,
        ...rest
    };
};
