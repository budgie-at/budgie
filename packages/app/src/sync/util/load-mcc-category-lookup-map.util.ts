import { mccCategoryRepository } from '../../@generic/drizzle/db/db';

import type { MccCategoryLookupInterface } from '@budgie/contracts';

export const loadMccCategoryLookupMap = async (): Promise<Map<string, MccCategoryLookupInterface>> => {
    const mccCategories = await mccCategoryRepository.findAll();

    return new Map(
        mccCategories.map(mccCategory => [
            mccCategory.mcc,
            { id: mccCategory.id, defaultCategoryId: mccCategory.defaultCategoryId ?? null }
        ])
    );
};
