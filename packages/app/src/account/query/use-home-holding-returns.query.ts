import {
    AccountEntityTable,
    AccountTypeEnum,
    InstrumentDailyMarketPriceEntityTable,
    InstrumentEntityTable,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryPositionRepository
} from '@budgie/contracts';
import { InstrumentDailyMarketPriceRepository, calculateInstrumentPosition } from '@budgie/market';
import { useAtomValue } from '@effect/atom-react/Hooks';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { calculatePortfolioReturn } from '../../brokerage/utils/calculate-portfolio-return.util';
import { getMarketDailyChange } from '../../market-data/utils/get-market-daily-change.util';
import { isMarketPriceStale } from '../../market-data/utils/is-market-price-stale.util';
import { defaultInstrumentIdAtom } from '../../settings/constants/settings-atoms.constant';
import { isAccountTypeSection } from '../type-guard/is-account-type-section.type-guard';
import { isHomeHolding } from '../type-guard/is-home-holding.type-guard';
import { isInstitutionGroup } from '../type-guard/is-institution-group.type-guard';
import { isFiatAccount } from '../utils/is-fiat-account.util';

import type { HoldingReturnInterface } from '../interface/holding-return.interface';
import type { HomeHoldingReturnsInterface } from '../interface/home-holding-returns.interface';
import type { HomeSectionInterface } from '../interface/home-section.interface';

const homePortfolioEntriesAtom = databaseQueryFamily(
    [TransactionEntryEntityTable, TransactionEntityTable, AccountEntityTable, InstrumentEntityTable],
    TransactionEntryPositionRepository,
    (repository, [instrumentIds, cashAccountIds, baseInstrumentId]: readonly [readonly number[], readonly number[], number]) =>
        Effect.all({
            positions: Effect.forEach(instrumentIds, instrumentId =>
                repository
                    .findInstrumentPositionEntries(instrumentId, baseInstrumentId)
                    .pipe(Effect.map(entries => [instrumentId, entries] as const))
            ),
            cashReturn: repository.findCashReturn(cashAccountIds, baseInstrumentId),
            cashKey: Effect.succeed(cashAccountIds.join()),
            baseInstrumentId: Effect.succeed(baseInstrumentId)
        })
);

const getDailyChangeKey = ([instrumentId, quoteInstrumentId]: readonly [number, number]): string => `${instrumentId}:${quoteInstrumentId}`;

const homeDailyChangesAtom = databaseQueryFamily(
    [InstrumentDailyMarketPriceEntityTable],
    InstrumentDailyMarketPriceRepository,
    (repository, pairs: readonly (readonly [number, number])[]) =>
        Effect.forEach(pairs, ([instrumentId, quoteInstrumentId]) =>
            repository
                .findRecent(instrumentId, quoteInstrumentId, 2)
                .pipe(
                    Effect.map(
                        prices =>
                            [
                                getDailyChangeKey([instrumentId, quoteInstrumentId]),
                                { change: getMarketDailyChange(prices.at(0), prices.at(1)), priceDate: prices.at(0)?.priceDate ?? null }
                            ] as const
                    )
                )
        )
);

const sortIds = (ids: readonly number[]): number[] => [...new Set(ids)].sort((left, right) => left - right);

export const useHomeHoldingReturnsQuery = (sections: readonly HomeSectionInterface[]): HomeHoldingReturnsInterface => {
    const defaultInstrumentId = useAtomValue(defaultInstrumentIdAtom);
    const holdingSections = sections.filter(isAccountTypeSection).map(section => {
        const brokerages = section.type === AccountTypeEnum.STOCKS ? section.data.filter(isInstitutionGroup) : [];
        const cashProviders = brokerages.filter(institution => institution.isHoldingProvider);

        return {
            type: section.type,
            holdings: section.data.filter(isHomeHolding),
            cash: cashProviders.reduce((total, institution) => total + institution.cash, 0),
            cashAccountIds: cashProviders.flatMap(institution => institution.accounts.filter(isFiatAccount).map(account => account.id))
        };
    });
    const instrumentIds = sortIds(holdingSections.flatMap(({ holdings }) => holdings.map(holding => holding.instrument.id)));
    const cashAccountIds = sortIds(holdingSections.flatMap(section => section.cashAccountIds));
    const quoteInstrumentIds = new Map(
        holdingSections.flatMap(({ holdings }) =>
            holdings.map(({ instrument }) => [instrument.id, instrument.quoteInstrumentId ?? defaultInstrumentId] as const)
        )
    );
    const dailyChangePairs = instrumentIds.map(
        instrumentId => [instrumentId, quoteInstrumentIds.get(instrumentId) ?? defaultInstrumentId] as const
    );
    const dailyChanges = new Map(AsyncResult.getOrElse(useLiveAtomValue(homeDailyChangesAtom(dailyChangePairs)), () => []));
    const todayByInstrumentId = new Map(
        dailyChangePairs.flatMap(pair => {
            const dailyChange = dailyChanges.get(getDailyChangeKey(pair));
            const isFresh = isDefined(dailyChange?.priceDate) && !isMarketPriceStale(dailyChange.priceDate);

            return isFresh && isDefined(dailyChange.change) && dailyChange.change > -1 ? [[pair[0], dailyChange.change] as const] : [];
        })
    );
    const data = AsyncResult.getOrElse(
        useLiveAtomValue(homePortfolioEntriesAtom([instrumentIds, cashAccountIds, defaultInstrumentId])),
        () => null
    );

    const isCurrentBase = data?.baseInstrumentId === defaultInstrumentId;
    const entriesByInstrumentId = new Map(isCurrentBase ? data.positions : []);
    const isCashCurrent = isCurrentBase && data.cashKey === cashAccountIds.join();
    const cashReturn = isCashCurrent ? data.cashReturn : 0;
    const results = holdingSections.map(({ type, holdings, cash }) => {
        const positions = holdings.map(holding => {
            const entries = entriesByInstrumentId.get(holding.instrument.id);
            const accountIds = holding.accounts.map(account => account.id);

            return { ...holding, position: isDefined(entries) ? calculateInstrumentPosition(entries, accountIds) : null };
        });
        const portfolio = calculatePortfolioReturn(positions, cash, type === AccountTypeEnum.STOCKS ? cashReturn : 0);
        const holdingReturns = positions.flatMap(({ instrument }, index): [number, HoldingReturnInterface][] => {
            const holdingReturn = portfolio.positionReturns[index];

            return isDefined(holdingReturn) ? [[instrument.id, holdingReturn]] : [];
        });
        const hasReturn = isNotEmptyArray(holdingReturns) || portfolio.gain !== 0;
        const todayMoves = holdings.flatMap(({ instrument, value }) => {
            const change = todayByInstrumentId.get(instrument.id);

            return isDefined(change) ? [{ value, gain: (value * change) / (1 + change) }] : [];
        });
        const todayGain = todayMoves.reduce((total, move) => total + move.gain, 0);
        const todayStartValue = todayMoves.reduce((total, move) => total + move.value - move.gain, 0);
        const today = isNotEmptyArray(todayMoves)
            ? { gain: todayGain, percent: isPositiveNumber(todayStartValue) ? todayGain / todayStartValue : null }
            : null;

        return { type, portfolio, hasReturn, today, holdingReturns: new Map(holdingReturns) };
    });

    return {
        holdingsBySectionType: new Map(results.map(({ type, holdingReturns }) => [type, holdingReturns])),
        bySectionType: new Map(results.flatMap(({ type, portfolio, hasReturn }) => (hasReturn ? [[type, portfolio] as const] : []))),
        todayByInstrumentId,
        todayBySectionType: new Map(results.flatMap(({ type, today }) => (isDefined(today) ? [[type, today] as const] : []))),
        isLoading:
            !isCashCurrent ||
            instrumentIds.some(instrumentId => !entriesByInstrumentId.has(instrumentId)) ||
            dailyChangePairs.some(pair => !dailyChanges.has(getDailyChangeKey(pair)))
    };
};
