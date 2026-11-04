import {
    AccountEntityTable,
    InstrumentDailyMarketPriceEntityTable,
    InvestmentReturnRepository,
    TransactionEntityTable,
    TransactionEntryEntityTable
} from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

const fundDividendTotalsAtom = databaseQueryFamily(
    [TransactionEntityTable, TransactionEntryEntityTable, AccountEntityTable],
    InvestmentReturnRepository,
    (investmentReturnRepository, fundTitle: string) => investmentReturnRepository.getFundDividendTotals(fundTitle)
);

const fundLatestPriceAtom = databaseQueryFamily(
    [InstrumentDailyMarketPriceEntityTable],
    InvestmentReturnRepository,
    (investmentReturnRepository, instrumentId: number) => investmentReturnRepository.findLatestPrice(instrumentId)
);

export const useInzhurFundReturnsQuery = (fundTitle: string, instrumentId: number) => ({
    dividendTotals: AsyncResult.getOrElse(useLiveAtomValue(fundDividendTotalsAtom(fundTitle)), () => null),
    latestPrice: AsyncResult.getOrElse(useLiveAtomValue(fundLatestPriceAtom(instrumentId)), () => null)
});
