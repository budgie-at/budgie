import { PRIVATBANK_CATEGORY_TO_MCC_CODE } from '@budgie/bank-sync';
import { getLogger } from '@budgie/logger';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { loadMccCategoryLookupMap } from '../util/load-mcc-category-lookup-map.util';

import type { MccCategoryLookupInterface } from '@budgie/contracts';

const logger = getLogger('privatbankCategoryMatcher');

const warnUnmatchedCategories = (unmatchedCategories: string[]): void => {
    if (isNotEmptyArray(unmatchedCategories)) {
        logger.log('unmatched-categories', { categories: unmatchedCategories.join(',') });
    }
};

// eslint-disable-next-line max-statements -- Category matching with unmatched category tracking
export const privatbankCategoryMatcherMatch = async (categories: string[]): Promise<Map<string, MccCategoryLookupInterface | null>> => {
    if (!isNotEmptyArray(categories)) {
        return new Map();
    }

    const mccCodeToLookupMap = await loadMccCategoryLookupMap();
    const resultMap = new Map<string, MccCategoryLookupInterface | null>();
    const unmatchedCategories: string[] = [];

    for (const category of categories) {
        const mccCode = PRIVATBANK_CATEGORY_TO_MCC_CODE[category];
        const mccCategoryLookup = isDefined(mccCode) ? (mccCodeToLookupMap.get(mccCode) ?? null) : null;
        resultMap.set(category, mccCategoryLookup);

        if (!isDefined(mccCode)) {
            unmatchedCategories.push(category);
        }
    }

    warnUnmatchedCategories(unmatchedCategories);

    return resultMap;
};
