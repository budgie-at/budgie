import { PRIVATBANK_CATEGORY_TO_MCC_GROUP_TYPE } from '@budgie/bank-sync';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { mccCategoryRepository, mccGroupRepository } from '../../@generic/drizzle/db/db';

const buildGroupTypeToIdMap = async (): Promise<Map<string, number>> => {
    const mccGroups = await mccGroupRepository.findAll();

    return new Map(mccGroups.map(group => [group.type, group.id]));
};

const buildGroupIdToFirstCategoryIdMap = async (): Promise<Map<number, number>> => {
    const mccCategories = await mccCategoryRepository.findAll();
    const groupToFirstCategory = new Map<number, number>();

    for (const mccCategory of mccCategories) {
        if (!groupToFirstCategory.has(mccCategory.mccGroupId)) {
            groupToFirstCategory.set(mccCategory.mccGroupId, mccCategory.id);
        }
    }

    return groupToFirstCategory;
};

export const privatbankCategoryMatcherMatch = async (categories: string[]): Promise<Map<string, number | null>> => {
    if (!isNotEmptyArray(categories)) {
        return new Map();
    }

    const [groupTypeToIdMap, groupIdToFirstCategoryIdMap] = await Promise.all([
        buildGroupTypeToIdMap(),
        buildGroupIdToFirstCategoryIdMap()
    ]);

    const resultMap = new Map<string, number | null>();

    for (const category of categories) {
        const groupType = PRIVATBANK_CATEGORY_TO_MCC_GROUP_TYPE[category];
        const groupId = isDefined(groupType) ? (groupTypeToIdMap.get(groupType) ?? null) : null;
        const mccCategoryId = isDefined(groupId) ? (groupIdToFirstCategoryIdMap.get(groupId) ?? null) : null;
        resultMap.set(category, mccCategoryId);
    }

    return resultMap;
};
