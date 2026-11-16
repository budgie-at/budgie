import { isAccountTypeSection } from '../type-guard/is-account-type-section.type-guard';
import { isHomeHolding } from '../type-guard/is-home-holding.type-guard';
import { isInstitutionGroup } from '../type-guard/is-institution-group.type-guard';

import { getHiddenProviderCashAccountIds } from './get-hidden-provider-cash-account-ids.util';
import { isShownHomeHolding } from './is-shown-home-holding.util';

import type { HomeAccountBalanceInterface } from '../interface/home-account-balance.interface';
import type { HomeSectionInterface } from '../interface/home-section.interface';

export const hideEmptyHomeHoldings = (
    section: HomeSectionInterface,
    balancesByAccountId: ReadonlyMap<number, Pick<HomeAccountBalanceInterface, 'balance' | 'convertedBalance' | 'isValued'>>,
    decimalPlaces: number
): HomeSectionInterface => {
    if (!isAccountTypeSection(section)) {
        return section;
    }

    const hiddenCashAccountIds = getHiddenProviderCashAccountIds(section.holdingProviders, balancesByAccountId, decimalPlaces);
    const data = section.data.filter(item => {
        if (isHomeHolding(item)) {
            return isShownHomeHolding(item, decimalPlaces);
        }

        return isInstitutionGroup(item) || !hiddenCashAccountIds.has(item.id);
    });
    const hiddenHoldings = section.data.filter(isHomeHolding).filter(holding => !isShownHomeHolding(holding, decimalPlaces));

    return { ...section, hiddenHoldings, data };
};
