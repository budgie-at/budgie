import { isDefined } from '@rnw-community/shared';

import { LlmTransactionResponseInterface } from '../interface/llm-transaction-response.interface';
import { LlmTransactionResponseSchema } from '../schema/llm-transaction-response.schema';

import { fixJson } from './fix-json.util';
import { parseNumberFromMessage } from './parse-number-words.util';

const JSON_PATTERN = /\{[^}]+\}/u;

const tryParseJson = (response: string): LlmTransactionResponseInterface | null => {
    const match = JSON_PATTERN.exec(response);

    if (!isDefined(match)) {
        return null;
    }

    const fixedJson = fixJson(match[0]);
    const parseResult = LlmTransactionResponseSchema.safeParse(JSON.parse(fixedJson));

    return parseResult.success ? parseResult.data : null;
};

const safeParseJson = (response: string): LlmTransactionResponseInterface | null => {
    try {
        return tryParseJson(response);
    } catch {
        return null;
    }
};

const extractCategoryIdFromText = (response: string): number | null => {
    const match = /\d+/u.exec(response);

    return isDefined(match) ? parseInt(match[0], 10) : null;
};

const createFallbackResponse = (response: string, userMessage: string): LlmTransactionResponseInterface | null => {
    const categoryId = extractCategoryIdFromText(response);

    if (!isDefined(categoryId) || categoryId <= 0) {
        return null;
    }

    return {
        categoryId,
        amount: parseNumberFromMessage(userMessage)
    };
};

export const parseLlmTransactionResponse = (response: string, userMessage: string): LlmTransactionResponseInterface | null =>
    safeParseJson(response) ?? createFallbackResponse(response, userMessage);
