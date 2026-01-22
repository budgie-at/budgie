import { isDefined } from '@rnw-community/shared';

import { ExpenseTypeMappingInterface } from '../interface/expense-type-mapping.interface';

const FALLBACK_CATEGORY_ID = 1;

interface ParsedExpenseInterface {
    type: string;
    amount: number;
}

const mapTypeToCategory = (type: string, mapping: ExpenseTypeMappingInterface[]): number => {
    const normalizedType = type.toLowerCase().trim();
    const exactMatch = mapping.find(entry => entry.type === normalizedType);

    if (isDefined(exactMatch)) {
        return exactMatch.categoryId;
    }

    const keywordMatch = mapping.find(entry => entry.keywords.includes(normalizedType));

    return keywordMatch?.categoryId ?? FALLBACK_CATEGORY_ID;
};

const extractJsonFromResponse = (response: string): string => {
    const codeBlockMatch = response.match(/```(?:json)?\s*(\{[^`]+\})\s*```/u);

    if (isDefined(codeBlockMatch)) {
        return codeBlockMatch[1].trim();
    }

    const jsonMatch = response.match(/\{[^{}]*"(?:type|amount)"[^{}]*\}/u);

    return jsonMatch?.[0] ?? response.trim();
};

/* eslint-disable lingui/no-unlocalized-strings */
export const buildCategorizationPrompt = (mapping: ExpenseTypeMappingInterface[]): string => {
    const allKeywords = mapping.flatMap(entry => entry.keywords.slice(0, 3));
    const uniqueKeywords = [...new Set(allKeywords)].slice(0, 30).join(', ');

    return `Extract expense type and amount from text. Pick ONE type that best matches.

Types: ${uniqueKeywords}

Reply with JSON only: {"type":"X","amount":N}`;
};
/* eslint-enable lingui/no-unlocalized-strings */

export const extractAndMapResponse = (
    response: string,
    mapping: ExpenseTypeMappingInterface[]
): { categoryId: number; amount: number } | null => {
    const jsonStr = extractJsonFromResponse(response);

    try {
        const parsed = JSON.parse(jsonStr) as ParsedExpenseInterface;

        if (typeof parsed.type === 'string' && typeof parsed.amount === 'number') {
            return { categoryId: mapTypeToCategory(parsed.type, mapping), amount: parsed.amount };
        }
    } catch {
        return null;
    }

    return null;
};
