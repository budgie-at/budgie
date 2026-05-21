import { mccCategoryRepository, settingsRepository } from '../../@generic/drizzle/db/db';

import type { MccCategoryLookupInterface } from '@budgie/contracts';

export const loadMccCategoryLookupMap = async (): Promise<Map<string, MccCategoryLookupInterface>> => {
    const [mccCategories, settings] = await Promise.all([mccCategoryRepository.findAll(), settingsRepository.getSettings()]);
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
};
