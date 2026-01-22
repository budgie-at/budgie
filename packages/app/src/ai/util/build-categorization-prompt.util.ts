import { isNotEmptyArray } from '@rnw-community/shared';

import { ExpenseTypeMappingInterface } from '../interface/expense-type-mapping.interface';

const FALLBACK_CATEGORY_ID = 1;
const LEGACY_FALLBACK_CATEGORY_ID = 39;

interface ParsedExpenseInterface {
    type: string;
    amount: number;
}

const EXPENSE_TYPE_TO_CATEGORY_MAP: Record<string, number[]> = {
    food: [11, 12],
    restaurant: [12],
    groceries: [11],
    transport: [13],
    fuel: [14],
    car: [14],
    entertainment: [16],
    shopping: [17],
    health: [18],
    bills: [20],
    subscription: [21],
    travel: [22],
    education: [24],
    gifts: [25],
    pets: [26],
    sports: [27],
    beauty: [28],
    home: [29],
    clothing: [30],
    electronics: [31],
    other: [39]
};

const mapTypeToCategory = (type: string, mapping: ExpenseTypeMappingInterface[]): number => {
    const normalizedType = type.toLowerCase().trim();
    const match = mapping.find(entry => entry.type === normalizedType);

    return match?.categoryId ?? FALLBACK_CATEGORY_ID;
};

const mapTypeToCategoryLegacy = (expenseType: string): number => {
    const normalizedType = expenseType.toLowerCase().trim();
    const categoryIds = EXPENSE_TYPE_TO_CATEGORY_MAP[normalizedType];

    if (isNotEmptyArray(categoryIds)) {
        return categoryIds[0];
    }

    return LEGACY_FALLBACK_CATEGORY_ID;
};

const extractTypeAmountJson = (response: string): string | undefined => {
    const typeAmountMatch = response.match(/\{\s*"type"\s*:\s*"[^"]+"\s*,\s*"amount"\s*:\s*\d+\s*\}/u);

    return typeAmountMatch?.[0];
};

const extractCategoryIdJson = (response: string): string | undefined => {
    const categoryMatch = response.match(/\{\s*"categoryId"\s*:\s*\d+\s*,\s*"amount"\s*:\s*\d+\s*\}/u);

    return categoryMatch?.[0];
};

const extractCodeBlockJson = (response: string): string | undefined => {
    const codeBlockMatch = response.match(/```(?:json)?\s*(\{[^`]+\})\s*```/u);

    return codeBlockMatch?.[1].trim();
};

const extractAnyJson = (response: string): string | undefined => {
    const anyJsonMatch = response.match(/\{[^{}]+\}/u);

    return anyJsonMatch?.[0];
};

const extractJsonFromResponse = (response: string): string =>
    extractCodeBlockJson(response) ??
    extractTypeAmountJson(response) ??
    extractCategoryIdJson(response) ??
    extractAnyJson(response) ??
    response.trim();

/* eslint-disable lingui/no-unlocalized-strings */
export const buildCategorizationPrompt = (mapping: ExpenseTypeMappingInterface[]): string => {
    const types = mapping.map(entry => entry.type).join(', ');

    return `Parse expense. Output JSON with "type" and "amount".

Types: ${types}

Output ONLY valid JSON: {"type":"X","amount":N}`;
};
/* eslint-enable lingui/no-unlocalized-strings */

export const extractAndMapResponse = (
    response: string,
    mapping?: ExpenseTypeMappingInterface[]
): { categoryId: number; amount: number } | null => {
    const jsonStr = extractJsonFromResponse(response);

    try {
        const parsed = JSON.parse(jsonStr) as ParsedExpenseInterface;

        if (typeof parsed.type === 'string' && typeof parsed.amount === 'number') {
            const categoryId = mapping ? mapTypeToCategory(parsed.type, mapping) : mapTypeToCategoryLegacy(parsed.type);

            return { categoryId, amount: parsed.amount };
        }

        if ('categoryId' in parsed && typeof (parsed as { categoryId: number }).categoryId === 'number') {
            return parsed as unknown as { categoryId: number; amount: number };
        }
    } catch {
        return null;
    }

    return null;
};
