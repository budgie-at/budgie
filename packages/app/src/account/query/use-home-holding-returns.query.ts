import {
    AccountEntityTable,
    AccountTypeEnum,
    InstrumentEntityTable,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryPositionRepository
} from '@budgie/contracts';
import { calculateInstrumentPosition } from '@budgie/market';
import { useAtomValue } from '@effect/atom-react/Hooks';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { calculatePortfolioReturn } from '../../brokerage/utils/calculate-portfolio-return.util';
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

        return { type, portfolio, hasReturn, holdingReturns: new Map(holdingReturns) };
    });

    return {
        holdingsBySectionType: new Map(results.map(({ type, holdingReturns }) => [type, holdingReturns])),
        bySectionType: new Map(results.flatMap(({ type, portfolio, hasReturn }) => (hasReturn ? [[type, portfolio] as const] : []))),
        isLoading: !isCashCurrent || instrumentIds.some(instrumentId => !entriesByInstrumentId.has(instrumentId))
    };
};
