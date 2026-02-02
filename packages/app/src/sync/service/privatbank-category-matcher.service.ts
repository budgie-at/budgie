/* eslint-disable lingui/no-unlocalized-strings */
import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { mccCategoryRepository, mccGroupRepository } from '../../@generic/drizzle/db/db';
import { LlmInterface } from '../../ai/context/llm.context';

import type { MccGroupEntityInterface } from '@budgie/contracts';

interface MccGroupMatchInputInterface {
    readonly id: number;
    readonly type: string;
    readonly description: string;
}

const CATEGORY_MATCHER_TEMPERATURE = 0.3;

const buildCategoryMatcherPrompt = (groups: MccGroupMatchInputInterface[]): string => {
    const groupList = groups.map(group => `${group.id}=${group.type} (${group.description})`).join('\n');

    return `Match Ukrainian bank transaction categories to MCC group IDs. Return ONLY comma-separated pairs of category=groupId.

MCC GROUPS:
${groupList}

EXAMPLES:
Input: Аптеки, Краса
Output: Аптеки=5912, Краса=7230

RULES:
- One pair per category
- Use exact category text from input
- If no match, use 0 as groupId
- Return ONLY category=id pairs, comma-separated`;
};

const parseSinglePair = (pair: string, validGroupIds: Set<number>): [string, number] | null => {
    const trimmedPair = pair.trim();
    const separatorIndex = trimmedPair.lastIndexOf('=');
    if (separatorIndex === -1) {
        return null;
    }

    const categoryName = trimmedPair.slice(0, separatorIndex).trim();
    const groupId = parseInt(trimmedPair.slice(separatorIndex + 1).trim(), 10);

    if (isNotEmptyString(categoryName) && !isNaN(groupId) && groupId !== 0 && validGroupIds.has(groupId)) {
        return [categoryName, groupId];
    }

    return null;
};

const parseCategoryMatcherResponse = (response: string, validGroupIds: Set<number>): Map<string, number> => {
    const result = new Map<string, number>();

    for (const pair of response.split(',')) {
        const parsed = parseSinglePair(pair, validGroupIds);
        if (isDefined(parsed)) {
            result.set(parsed[0], parsed[1]);
        }
    }

    return result;
};

const buildGroupToMccCategoryMap = async (): Promise<Map<number, number>> => {
    const mccCategories = await mccCategoryRepository.findAll();
    const groupToFirstCategory = new Map<number, number>();

    for (const mccCategory of mccCategories) {
        if (!groupToFirstCategory.has(mccCategory.mccGroupId)) {
            groupToFirstCategory.set(mccCategory.mccGroupId, mccCategory.id);
        }
    }

    return groupToFirstCategory;
};

const createNullResultMap = (categories: string[]): Map<string, number | null> => new Map(categories.map(category => [category, null]));

const buildResultMap = (
    categories: string[],
    groupIdMap: Map<string, number>,
    groupToMccCategoryMap: Map<number, number>
): Map<string, number | null> => {
    const resultMap = new Map<string, number | null>();

    for (const category of categories) {
        const groupId = groupIdMap.get(category);
        const mccCategoryId = isDefined(groupId) ? (groupToMccCategoryMap.get(groupId) ?? null) : null;
        resultMap.set(category, mccCategoryId);
    }

    return resultMap;
};

const matchCategoriesWithLlm = async (
    llm: LlmInterface,
    categories: string[],
    mccGroups: MccGroupEntityInterface[]
): Promise<Map<string, number | null>> => {
    const groupInputs: MccGroupMatchInputInterface[] = mccGroups.map(group => ({
        id: group.id,
        type: group.type,
        description: group.description
    }));

    const validGroupIds = new Set(mccGroups.map(group => group.id));
    const systemPrompt = buildCategoryMatcherPrompt(groupInputs);
    const userMessage = categories.join(', ');
    const response = await llm.generate(systemPrompt, userMessage, { temperature: CATEGORY_MATCHER_TEMPERATURE });

    const groupIdMap = parseCategoryMatcherResponse(response, validGroupIds);
    const groupToMccCategoryMap = await buildGroupToMccCategoryMap();

    return buildResultMap(categories, groupIdMap, groupToMccCategoryMap);
};

export const privatbankCategoryMatcherMatch = async (llm: LlmInterface, categories: string[]): Promise<Map<string, number | null>> => {
    if (!isNotEmptyArray(categories)) {
        return new Map();
    }

    try {
        const mccGroups: MccGroupEntityInterface[] = await mccGroupRepository.findAll();
        if (!isNotEmptyArray(mccGroups)) {
            return createNullResultMap(categories);
        }

        return await matchCategoriesWithLlm(llm, categories, mccGroups);
    } catch (_error: unknown) {
        return createNullResultMap(categories);
    }
};
