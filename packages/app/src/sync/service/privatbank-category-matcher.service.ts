import { PRIVATBANK_CATEGORY_TO_MCC_CODE } from '@budgie/bank-sync';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { loadMccCategoryLookupMap } from '../util/load-mcc-category-lookup-map.util';

import type { MccCategoryLookupInterface } from '@budgie/contracts';

class PrivatbankCategoryMatcherService {
    @Log(
        categories => `enter categoryCount=${categories.length}`,
        (result, categories) => `done categoryCount=${categories.length} matchedCount=${[...result.values()].filter(isDefined).length}`,
        (error, categories) => `throw categoryCount=${categories.length} error=${getErrorMessage(error)}`
    )
    async match(categories: string[]): Promise<Map<string, MccCategoryLookupInterface | null>> {
        if (!isNotEmptyArray(categories)) {
            return new Map();
        }

        const mccCodeToLookupMap = await loadMccCategoryLookupMap();

        return this.matchCategories(categories, mccCodeToLookupMap);
    }

    private matchCategories(
        categories: string[],
        mccCodeToLookupMap: Map<string, MccCategoryLookupInterface>
    ): Map<string, MccCategoryLookupInterface | null> {
        const resultMap = new Map<string, MccCategoryLookupInterface | null>();

        for (const category of categories) {
            const mccCode = PRIVATBANK_CATEGORY_TO_MCC_CODE[category];
            const mccCategoryLookup = isDefined(mccCode) ? (mccCodeToLookupMap.get(mccCode) ?? null) : null;
            resultMap.set(category, mccCategoryLookup);
        }

        return resultMap;
    }
}

export const privatbankCategoryMatcherService = new PrivatbankCategoryMatcherService();
