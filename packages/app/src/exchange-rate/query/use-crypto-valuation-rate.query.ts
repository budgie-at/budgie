import { AccountEntityTable, ExchangeRateEntityTable, InstrumentDailyMarketPriceEntityTable } from '@budgie/contracts';
import { ExchangeRateRepository } from '@budgie/market';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

const cryptoValuationRatesAtom = databaseQueryFamily(
    [AccountEntityTable, ExchangeRateEntityTable, InstrumentDailyMarketPriceEntityTable],
    ExchangeRateRepository,
    (exchangeRateRepository, quoteInstrumentId: number) => exchangeRateRepository.findCryptoAccountValuationRates(quoteInstrumentId)
);

export const useCryptoValuationRateQuery = (instrumentId: number, quoteInstrumentId: number) => {
    const valuationRates = AsyncResult.getOrElse(useLiveAtomValue(cryptoValuationRatesAtom(quoteInstrumentId)), () => []);
    const valuationRate = valuationRates.find(row => row.instrumentId === instrumentId);

    return valuationRate?.rate ?? valuationRate?.price ?? null;
};
