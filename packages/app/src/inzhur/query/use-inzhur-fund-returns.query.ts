import {
    AccountEntityTable,
    InstrumentEntityTable,
    InstrumentRepository,
    CurrencyEnum,
    InvestmentReturnRepository,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    InstrumentDailyMarketPriceEntityTable
} from '@budgie/contracts';
import { InstrumentDailyMarketPriceRepository } from '@budgie/market';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isDefined } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

const fundDividendTotalsAtom = databaseQueryFamily(
    [TransactionEntityTable, TransactionEntryEntityTable, AccountEntityTable],
    InvestmentReturnRepository,
    (investmentReturnRepository, fundAccountId: number) =>
        Effect.map(
            investmentReturnRepository.getFundDividendTotals(),
            totals => totals.find(row => row.fundAccountId === fundAccountId) ?? null
        )
);

const fundLatestPriceAtom = databaseQueryFamily(
    [InstrumentDailyMarketPriceEntityTable, InstrumentEntityTable],
    InstrumentDailyMarketPriceRepository,
    (instrumentDailyMarketPriceRepository, instrumentId: number) =>
        Effect.flatMap(InstrumentRepository, instrumentRepository =>
            Effect.flatMap(instrumentRepository.findByCode(CurrencyEnum.UAH), hryvnia =>
                isDefined(hryvnia) ? instrumentDailyMarketPriceRepository.findLatest(instrumentId, hryvnia.id) : Effect.succeed(null)
            )
        )
);

export const useInzhurFundReturnsQuery = (fundAccountId: number, instrumentId: number) => ({
    dividendTotals: AsyncResult.getOrElse(useLiveAtomValue(fundDividendTotalsAtom(fundAccountId)), () => null),
    latestPrice: AsyncResult.getOrElse(useLiveAtomValue(fundLatestPriceAtom(instrumentId)), () => null)
});
