import { loadMccCategoryLookupMap, MccCategoryRepository, SettingsRepository } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { PRIVATBANK_CATEGORY_TO_MCC_CODE } from '../constant/privatbank-category-to-mcc-code.constant';

import type { MccCategoryLookupInterface } from '@budgie/contracts';

export class PrivatbankCategoryMatcherService extends Context.Service<PrivatbankCategoryMatcherService>()(
    '@budgie/sync/PrivatbankCategoryMatcherService',
    {
        make: Effect.gen(function* () {
            const mccCategoryRepository = yield* MccCategoryRepository;
            const settingsRepository = yield* SettingsRepository;

            const matchCategories = (
                categories: string[],
                mccCodeToLookupMap: Map<string, MccCategoryLookupInterface>
            ): Map<string, MccCategoryLookupInterface | null> => {
                const resultMap = new Map<string, MccCategoryLookupInterface | null>();

                for (const category of categories) {
                    const mccCode = PRIVATBANK_CATEGORY_TO_MCC_CODE[category];
                    const mccCategoryLookup = isDefined(mccCode) ? (mccCodeToLookupMap.get(mccCode) ?? null) : null;
                    resultMap.set(category, mccCategoryLookup);
                }

                return resultMap;
            };

            return {
                match: Effect.fn('PrivatbankCategoryMatcherService.match')(function* (categories: string[]) {
                    if (!isNotEmptyArray(categories)) {
                        return new Map<string, MccCategoryLookupInterface | null>();
                    }

                    const mccCodeToLookupMap = yield* loadMccCategoryLookupMap(mccCategoryRepository, settingsRepository);

                    return matchCategories(categories, mccCodeToLookupMap);
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(PrivatbankCategoryMatcherService, PrivatbankCategoryMatcherService.make).pipe(
        Layer.provide([MccCategoryRepository.layer, SettingsRepository.layer])
    );
}
