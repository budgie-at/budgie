import { CurrencyEnum } from '@budgie/contracts';
import { z } from 'zod';

import { isDefined } from '@rnw-community/shared';

const ParsedItemSchema = z.object({
    categoryId: z.union([z.number(), z.string()]),
    amount: z.number(),
    currency: z.string().nullable().optional()
});

type ParsedItemType = z.infer<typeof ParsedItemSchema>;

export interface ParsedCategorizationItemInterface {
    categoryId: number | string;
    amount: number;
    currency: CurrencyEnum | null;
}

const fixMalformedJson = (text: string): string => {
    let cleaned = text.trim();

    const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/u);
    if (isDefined(codeBlockMatch)) {
        cleaned = codeBlockMatch[1].trim();
    }

    if (!cleaned.startsWith('[') && cleaned.includes('{')) {
        cleaned = `[${cleaned}`;
    }

    if (!cleaned.endsWith(']') && cleaned.includes('}')) {
        cleaned = `${cleaned}]`;
    }

    cleaned = cleaned.replace(/,\s*\]/gu, ']');
    cleaned = cleaned.replace(/\}\s*\{/gu, '},{');

    return cleaned;
};

const CURRENCY_ENUM_VALUES = new Set<string>(Object.values(CurrencyEnum));
const EXTRACT_JSON_PATTERN = /\{[^{}]*"categoryId"\s*:\s*(?:\d+|"[^"]+")[^{}]*"amount"\s*:\s*\d+(?:\.\d+)?[^{}]*\}/gu;

const isCurrencyEnum = (value: string): value is CurrencyEnum => CURRENCY_ENUM_VALUES.has(value);

const validateCurrency = (currency: string | null | undefined): CurrencyEnum | null => {
    if (!isDefined(currency)) {
        return null;
    }

    const normalized = currency.toUpperCase();

    return isCurrencyEnum(normalized) ? normalized : null;
};

const mapToInterface = (item: ParsedItemType): ParsedCategorizationItemInterface => ({
    categoryId: item.categoryId,
    amount: item.amount,
    currency: validateCurrency(item.currency)
});

const extractWithRegex = (response: string): ParsedCategorizationItemInterface[] => {
    EXTRACT_JSON_PATTERN.lastIndex = 0;
    const matches = [...response.matchAll(EXTRACT_JSON_PATTERN)];

    return matches
        .map(match => {
            try {
                const parsed = ParsedItemSchema.safeParse(JSON.parse(match[0]));

                return parsed.success ? mapToInterface(parsed.data) : null;
            } catch {
                return null;
            }
        })
        .filter((item): item is ParsedCategorizationItemInterface => item !== null);
};

export const parseLlmJsonResponse = (response: string): ParsedCategorizationItemInterface[] => {
    const jsonStr = fixMalformedJson(response);

    try {
        const parsed = JSON.parse(jsonStr) as unknown;

        if (Array.isArray(parsed)) {
            return parsed
                .map(item => {
                    const result = ParsedItemSchema.safeParse(item);

                    return result.success ? mapToInterface(result.data) : null;
                })
                .filter((item): item is ParsedCategorizationItemInterface => item !== null);
        }

        const singleResult = ParsedItemSchema.safeParse(parsed);
        if (singleResult.success) {
            return [mapToInterface(singleResult.data)];
        }
    } catch {
        return extractWithRegex(response);
    }

    return extractWithRegex(response);
};
