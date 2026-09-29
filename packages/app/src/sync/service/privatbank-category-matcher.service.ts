import { PRIVATBANK_CATEGORY_TO_MCC_CODE } from '@budgie/sync';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { loadMccCategoryLookupMap } from '../util/load-mcc-category-lookup-map.util';

import type { MccCategoryLookupInterface } from '@budgie/contracts';

class PrivatbankCategoryMatcherService {
    readonly match = Effect.fn('PrivatbankCategoryMatcherService.match')(function* (
        this: PrivatbankCategoryMatcherService,
        categories: string[]
    ) {
        if (!isNotEmptyArray(categories)) {
            return new Map<string, MccCategoryLookupInterface | null>();
        }

        const mccCodeToLookupMap = yield* loadMccCategoryLookupMap();

        return this.matchCategories(categories, mccCodeToLookupMap);
    });

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
