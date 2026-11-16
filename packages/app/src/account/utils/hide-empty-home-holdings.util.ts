import { isAccountTypeSection } from '../type-guard/is-account-type-section.type-guard';
import { isHomeHolding } from '../type-guard/is-home-holding.type-guard';
import { isInstitutionGroup } from '../type-guard/is-institution-group.type-guard';

import { summarizeHoldingPositions } from './summarize-holding-positions.util';

import type { HomeHoldingInterface } from '../interface/home-holding.interface';
import type { HomeSectionInterface } from '../interface/home-section.interface';

const isShownHomeHolding = (holding: Pick<HomeHoldingInterface, 'balance' | 'value' | 'isValued'>, decimalPlaces: number): boolean =>
    holding.balance !== 0 && (!holding.isValued || Math.round(Math.abs(holding.value) * 10 ** decimalPlaces) !== 0);

export const hideEmptyHomeHoldings = (section: HomeSectionInterface, decimalPlaces: number): HomeSectionInterface => {
    if (!isAccountTypeSection(section)) {
        return section;
    }

    const data = section.data.filter(item => !isHomeHolding(item) || isShownHomeHolding(item, decimalPlaces));
    const hiddenHoldings = section.data.filter(isHomeHolding).filter(holding => !isShownHomeHolding(holding, decimalPlaces));
    const shownInstrumentIds = new Set(data.filter(isHomeHolding).map(holding => holding.instrument.id));

    return {
        ...section,
        hiddenHoldings,
        data: data.map(item =>
            isInstitutionGroup(item) && item.isHoldingProvider
                ? { ...item, ...summarizeHoldingPositions(item.accounts, instrumentId => shownInstrumentIds.has(instrumentId)) }
                : item
        )
    };
};
