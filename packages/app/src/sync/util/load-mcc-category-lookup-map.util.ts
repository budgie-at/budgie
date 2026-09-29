import { Db } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { mccCategoryRepository, settingsRepository } from '../../@generic/drizzle/db/db';

export const loadMccCategoryLookupMap = Effect.fnUntraced(function* () {
    const [mccCategories, settings] = yield* Effect.all([
        Db.query(() => mccCategoryRepository.findAll()),
        settingsRepository.getSettings()
    ]);
    const applyMccDefault = settings.applyMccDefaultCategory;

    return new Map(
        mccCategories.map(mccCategory => [
            mccCategory.mcc,
            {
                id: mccCategory.id,
                defaultCategoryId: applyMccDefault ? (mccCategory.defaultCategoryId ?? null) : null
            }
        ])
    );
});
