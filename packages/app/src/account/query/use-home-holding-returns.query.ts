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

import type { PortfolioReturnInterface } from '../../brokerage/interface/portfolio-return.interface';
import type { DailyChangeInterface } from '../interface/daily-change.interface';
import type { HoldingReturnInterface } from '../interface/holding-return.interface';
import type { HomeAccountBalanceInterface } from '../interface/home-account-balance.interface';
import type { HomeHoldingReturnsInterface } from '../interface/home-holding-returns.interface';
import type { HomeHoldingInterface } from '../interface/home-holding.interface';
import type { HomeSectionInterface } from '../interface/home-section.interface';
import type { InstitutionGroupInterface } from '../interface/institution-group.interface';
import type { InstrumentPositionInterface } from '@budgie/market';

const getCashKey = (providerCashAccountIds: readonly (readonly [number, readonly number[]])[]): string =>
    providerCashAccountIds.map(([integrationId, cashAccountIds]) => `${integrationId}:${cashAccountIds.join('-')}`).join();

const homePortfolioEntriesAtom = databaseQueryFamily(
    [TransactionEntryEntityTable, TransactionEntityTable, AccountEntityTable, InstrumentEntityTable],
    TransactionEntryPositionRepository,
    (
        repository,
        [instrumentIds, providerCashAccountIds, baseInstrumentId]: readonly [
            readonly number[],
            readonly (readonly [number, readonly number[]])[],
            number
        ]
    ) =>
        Effect.all({
            positions: Effect.forEach(instrumentIds, instrumentId =>
                repository
                    .findInstrumentPositionEntries(instrumentId, baseInstrumentId)
                    .pipe(Effect.map(entries => [instrumentId, entries] as const))
            ),
            cashReturns: Effect.forEach(providerCashAccountIds, ([integrationId, cashAccountIds]) =>
                repository.findCashReturn(cashAccountIds, baseInstrumentId).pipe(Effect.map(amount => [integrationId, amount] as const))
            ),
            cashKey: Effect.succeed(getCashKey(providerCashAccountIds)),
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

const getProviderReturnPercent = (
    institution: Pick<InstitutionGroupInterface, 'integrationId' | 'accounts' | 'cash'>,
    balancesByAccountId: ReadonlyMap<number, HomeAccountBalanceInterface>,
    getPosition: (instrumentId: number, accountIds: readonly number[]) => InstrumentPositionInterface | null,
    cashReturns: ReadonlyMap<number, number>
): number | null => {
    const portfolio = calculatePortfolioReturn(
        institution.accounts
            .filter(account => !isFiatAccount(account))
            .map(account => ({
                value: balancesByAccountId.get(account.id)?.convertedBalance ?? 0,
                balance: balancesByAccountId.get(account.id)?.balance ?? 0,
                isValued: balancesByAccountId.get(account.id)?.isValued === true,
                position: getPosition(account.instrument.id, [account.id])
            })),
        institution.cash,
        cashReturns.get(institution.integrationId) ?? 0
    );

    return portfolio.positionReturns.some(isDefined) ? portfolio.percent : null;
};

const getFreshDailyChanges = (
    dailyChangePairs: readonly (readonly [number, number])[],
    dailyChanges: ReadonlyMap<string, DailyChangeInterface>
): ReadonlyMap<number, number> =>
    new Map(
        dailyChangePairs.flatMap(pair => {
            const dailyChange = dailyChanges.get(getDailyChangeKey(pair));
            const isFresh = isDefined(dailyChange?.priceDate) && !isMarketPriceStale(dailyChange.priceDate);

            return isFresh && isDefined(dailyChange.change) && dailyChange.change > -1 ? [[pair[0], dailyChange.change] as const] : [];
        })
    );

const getSectionToday = (
    holdings: readonly Pick<HomeHoldingInterface, 'instrument' | 'value' | 'isValued'>[],
    total: number,
    todayByInstrumentId: ReadonlyMap<number, number>
): Pick<PortfolioReturnInterface, 'gain' | 'percent'> | null => {
    const valuedHoldings = holdings.filter(holding => holding.isValued);

    if (!isNotEmptyArray(valuedHoldings) || !valuedHoldings.every(holding => todayByInstrumentId.has(holding.instrument.id))) {
        return null;
    }

    const gain = valuedHoldings.reduce((sum, { instrument, value }) => {
        const change = todayByInstrumentId.get(instrument.id) ?? 0;

        return sum + (value * change) / (1 + change);
    }, 0);

    return { gain, percent: isPositiveNumber(total - gain) ? gain / (total - gain) : null };
};

const sortIds = (ids: readonly number[]): number[] => [...new Set(ids)].sort((left, right) => left - right);

export const useHomeHoldingReturnsQuery = (
    sections: readonly HomeSectionInterface[],
    balancesByAccountId: ReadonlyMap<number, HomeAccountBalanceInterface>
): HomeHoldingReturnsInterface => {
    const defaultInstrumentId = useAtomValue(defaultInstrumentIdAtom);
    const holdingSections = sections.filter(isAccountTypeSection).map(section => {
        const brokerages = section.type === AccountTypeEnum.STOCKS ? section.data.filter(isInstitutionGroup) : [];
        const cashProviders = brokerages.filter(institution => institution.isHoldingProvider);

        return {
            type: section.type,
            total: section.total,
            holdings: section.data.filter(isHomeHolding),
            cashProviders
        };
    });
    const instrumentIds = sortIds(holdingSections.flatMap(({ holdings }) => holdings.map(holding => holding.instrument.id)));
    const providerCashAccountIds = holdingSections
        .flatMap(({ cashProviders }) => cashProviders)
        .map(
            institution =>
                [institution.integrationId, sortIds(institution.accounts.filter(isFiatAccount).map(account => account.id))] as const
        )
        .sort(([left], [right]) => left - right);
    const quoteInstrumentIds = new Map(
        holdingSections.flatMap(({ holdings }) =>
            holdings.map(({ instrument }) => [instrument.id, instrument.quoteInstrumentId ?? defaultInstrumentId] as const)
        )
    );
    const dailyChangePairs = instrumentIds.map(
        instrumentId => [instrumentId, quoteInstrumentIds.get(instrumentId) ?? defaultInstrumentId] as const
    );
    const dailyChanges = new Map(AsyncResult.getOrElse(useLiveAtomValue(homeDailyChangesAtom(dailyChangePairs)), () => []));
    const todayByInstrumentId = getFreshDailyChanges(dailyChangePairs, dailyChanges);
    const data = AsyncResult.getOrElse(
        useLiveAtomValue(homePortfolioEntriesAtom([instrumentIds, providerCashAccountIds, defaultInstrumentId])),
        () => null
    );

    const isCurrentBase = data?.baseInstrumentId === defaultInstrumentId;
    const entriesByInstrumentId = new Map(isCurrentBase ? data.positions : []);
    const isCashCurrent = isCurrentBase && data.cashKey === getCashKey(providerCashAccountIds);
    const cashReturns = new Map(isCashCurrent ? data.cashReturns : []);
    const getPosition = (instrumentId: number, accountIds: readonly number[]) => {
        const entries = entriesByInstrumentId.get(instrumentId);

        return isDefined(entries) ? calculateInstrumentPosition(entries, accountIds) : null;
    };
    const providerReturns = holdingSections
        .flatMap(({ cashProviders }) => cashProviders)
        .flatMap(institution => {
            const percent = getProviderReturnPercent(institution, balancesByAccountId, getPosition, cashReturns);

            return isDefined(percent) ? [[institution.integrationId, percent] as const] : [];
        });
    const results = holdingSections.map(({ type, total, holdings, cashProviders }) => {
        const positions = holdings.map(holding => ({
            ...holding,
            position: getPosition(
                holding.instrument.id,
                holding.accounts.map(account => account.id)
            )
        }));
        const portfolio = calculatePortfolioReturn(
            positions,
            cashProviders.reduce((sum, institution) => sum + institution.cash, 0),
            cashProviders.reduce((sum, institution) => sum + (cashReturns.get(institution.integrationId) ?? 0), 0)
        );
        const holdingReturns = positions.flatMap(({ instrument }, index): [number, HoldingReturnInterface][] => {
            const holdingReturn = portfolio.positionReturns[index];

            return isDefined(holdingReturn) ? [[instrument.id, holdingReturn]] : [];
        });
        const hasReturn = isNotEmptyArray(holdingReturns) || portfolio.gain !== 0;
        const today = getSectionToday(holdings, total, todayByInstrumentId);

        return { type, portfolio, hasReturn, today, holdingReturns: new Map(holdingReturns) };
    });

    return {
        holdingsBySectionType: new Map(results.map(({ type, holdingReturns }) => [type, holdingReturns])),
        bySectionType: new Map(results.flatMap(({ type, portfolio, hasReturn }) => (hasReturn ? [[type, portfolio] as const] : []))),
        todayByInstrumentId,
        providerReturnByIntegrationId: new Map(providerReturns),
        todayBySectionType: new Map(results.flatMap(({ type, today }) => (isDefined(today) ? [[type, today] as const] : []))),
        isLoading:
            !isCashCurrent ||
            instrumentIds.some(instrumentId => !entriesByInstrumentId.has(instrumentId)) ||
            dailyChangePairs.some(pair => !dailyChanges.has(getDailyChangeKey(pair)))
    };
};
