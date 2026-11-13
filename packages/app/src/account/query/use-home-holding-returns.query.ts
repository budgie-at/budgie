import { calculateInstrumentPosition } from '@budgie/market';
import { useAtomValue } from '@effect/atom-react/Hooks';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { instrumentPositionEntriesAtom } from '../../market-data/query/use-instrument-positions.query';
import { defaultInstrumentIdAtom } from '../../settings/constants/settings-atoms.constant';
import { isAccountTypeSection } from '../type-guard/is-account-type-section.type-guard';
import { isHomeHolding } from '../type-guard/is-home-holding.type-guard';

import type { HoldingReturnInterface } from '../interface/holding-return.interface';
import type { HomeHoldingReturnsInterface } from '../interface/home-holding-returns.interface';
import type { HomeHoldingInterface } from '../interface/home-holding.interface';
import type { HomeSectionInterface } from '../interface/home-section.interface';
import type { AccountTypeEnum, InstrumentPositionEntryRowInterface } from '@budgie/contracts';

const getHoldingReturn = (
    holding: HomeHoldingInterface,
    entries: readonly InstrumentPositionEntryRowInterface[]
): HoldingReturnInterface | null => {
    const position = calculateInstrumentPosition(
        entries,
        holding.accounts.map(account => account.id)
    );

    if (!holding.isValued || !isPositiveNumber(holding.balance) || !isDefined(position.costBasis)) {
        return null;
    }

    return {
        gain: holding.value * Math.min(position.amount / holding.balance, 1) - position.costBasis,
        costBasis: position.costBasis
    };
};

export const useHomeHoldingReturnsQuery = (sections: readonly HomeSectionInterface[]): HomeHoldingReturnsInterface => {
    const defaultInstrumentId = useAtomValue(defaultInstrumentIdAtom);
    const holdings = sections
        .filter(isAccountTypeSection)
        .flatMap(section => section.data.filter(isHomeHolding).map(holding => ({ type: section.type, holding })));
    const result = useLiveAtomValue(
        instrumentPositionEntriesAtom([holdings.map(({ holding }) => holding.instrument.id), defaultInstrumentId])
    );
    const entries = AsyncResult.getOrElse(result, () => []);
    const isLoading = isNotEmptyArray(holdings) && entries.length !== holdings.length;

    const holdingReturns = holdings.flatMap(({ type, holding }, index) => {
        const holdingReturn = isLoading ? null : getHoldingReturn(holding, entries[index]);

        return isDefined(holdingReturn) ? [{ type, instrumentId: holding.instrument.id, holdingReturn }] : [];
    });
    const bySectionType = new Map<AccountTypeEnum, HoldingReturnInterface>();

    for (const { type, holdingReturn } of holdingReturns) {
        const sectionReturn = bySectionType.get(type);

        bySectionType.set(type, {
            gain: (sectionReturn?.gain ?? 0) + holdingReturn.gain,
            costBasis: (sectionReturn?.costBasis ?? 0) + holdingReturn.costBasis
        });
    }

    return {
        byInstrumentId: new Map(holdingReturns.map(({ instrumentId, holdingReturn }) => [instrumentId, holdingReturn])),
        bySectionType,
        isLoading
    };
};
