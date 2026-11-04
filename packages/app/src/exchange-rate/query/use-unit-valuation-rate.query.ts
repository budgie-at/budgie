import {
    AccountEntityTable,
    ExchangeRateEntityTable,
    HistoricalExchangeRateEntityTable,
    InstrumentDailyMarketPriceEntityTable,
    InstrumentEntityTable
} from '@budgie/contracts';
import { ExchangeRateRepository } from '@budgie/market';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

const unitValuationRatesAtom = databaseQueryFamily(
    [
        AccountEntityTable,
        ExchangeRateEntityTable,
        HistoricalExchangeRateEntityTable,
        InstrumentDailyMarketPriceEntityTable,
        InstrumentEntityTable
    ],
    ExchangeRateRepository,
    (exchangeRateRepository, quoteInstrumentId: number) => exchangeRateRepository.findUnitAccountValuationRates(quoteInstrumentId)
);

export const useUnitValuationRateQuery = (instrumentId: number, quoteInstrumentId: number) => {
    const valuationRates = AsyncResult.getOrElse(useLiveAtomValue(unitValuationRatesAtom(quoteInstrumentId)), () => []);
    const valuationRate = valuationRates.find(row => row.instrumentId === instrumentId);

    return valuationRate?.rate ?? null;
};
