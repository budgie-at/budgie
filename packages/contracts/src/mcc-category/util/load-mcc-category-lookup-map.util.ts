import * as Effect from 'effect/Effect';

import type { SettingsRepository } from '../../settings/repository/settings.repository';
import type { MccCategoryRepository } from '../repository/mcc-category.repository';
import type * as Context from 'effect/Context';

export const loadMccCategoryLookupMap = Effect.fnUntraced(function* (
    mccCategoryRepository: Context.Service.Shape<typeof MccCategoryRepository>,
    settingsRepository: Context.Service.Shape<typeof SettingsRepository>
) {
    const [mccCategories, settings] = yield* Effect.all([mccCategoryRepository.findAll(), settingsRepository.getSettings()]);
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
