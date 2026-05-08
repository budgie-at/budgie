import { PRIVATBANK_CATEGORY_TO_MCC_CODE } from '@budgie/bank-sync';
import { getLogger } from '@budgie/logger';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { mccCategoryRepository } from '../../@generic/drizzle/db/db';

const logger = getLogger('privatbankCategoryMatcher');

const buildMccCodeToIdMap = async (): Promise<Map<string, number>> => {
    const mccCategories = await mccCategoryRepository.findAll();

    return new Map(mccCategories.map(category => [category.mcc, category.id]));
};

const warnUnmatchedCategories = (unmatchedCategories: string[]): void => {
    if (isNotEmptyArray(unmatchedCategories)) {
        logger.log('unmatched-categories', { categories: unmatchedCategories.join(',') });
    }
};

// eslint-disable-next-line max-statements -- Category matching with unmatched category tracking
export const privatbankCategoryMatcherMatch = async (categories: string[]): Promise<Map<string, number | null>> => {
    if (!isNotEmptyArray(categories)) {
        return new Map();
    }

    const mccCodeToIdMap = await buildMccCodeToIdMap();
    const resultMap = new Map<string, number | null>();
    const unmatchedCategories: string[] = [];

    for (const category of categories) {
        const mccCode = PRIVATBANK_CATEGORY_TO_MCC_CODE[category];
        const mccCategoryId = isDefined(mccCode) ? (mccCodeToIdMap.get(mccCode) ?? null) : null;
        resultMap.set(category, mccCategoryId);

        if (!isDefined(mccCode)) {
            unmatchedCategories.push(category);
        }
    }

    warnUnmatchedCategories(unmatchedCategories);

    return resultMap;
};
