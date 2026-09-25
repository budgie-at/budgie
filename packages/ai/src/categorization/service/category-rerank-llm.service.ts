import { Log } from '@budgie/logger';
import { z } from 'zod';

import { getErrorMessage } from '@rnw-community/shared';

import { ChatInvokerInterface } from '../../chat/interface/chat-invoker.interface';
import { CATEGORY_RERANK_SYSTEM_PROMPT } from '../constant/category-rerank-prompt.constant';

import type { GenerateOptionsInterface } from '../../@generic/interface/generate-options.interface';
import type { CategoryRerankCandidateInterface } from '../interface/category-rerank-candidate.interface';
import type { CategoryRerankExampleInterface } from '../interface/category-rerank-example.interface';
import type { CategoryRerankMerchantInterface } from '../interface/category-rerank-merchant.interface';

export class CategoryRerankLlmService {
    private static readonly MAX_CANDIDATES = 30;
    private static readonly MAX_EXAMPLES = 6;
    private static readonly MAX_NEW_TOKENS = 16;
    private static readonly UNRESOLVED_CATEGORY_ID = 0;
    private static readonly RESPONSE_SCHEMA = z.object({ categoryId: z.number().int() });

    constructor(private readonly chat: ChatInvokerInterface) {}

    @Log(
        (merchant, candidates, examples) =>
            `enter title="${merchant.title}" candidateCount=${candidates.length} exampleCount=${examples.length}`,
        (result, merchant, candidates, examples) =>
            `done title="${merchant.title}" candidateCount=${candidates.length} exampleCount=${examples.length} categoryId=${String(result)}`,
        (error, merchant, candidates, examples) =>
            `throw title="${merchant.title}" candidateCount=${candidates.length} exampleCount=${examples.length} error=${getErrorMessage(error)}`
    )
    async pickCategory(
        merchant: CategoryRerankMerchantInterface,
        candidates: CategoryRerankCandidateInterface[],
        examples: CategoryRerankExampleInterface[]
    ): Promise<number | null> {
        const boundedCandidates = candidates.slice(0, CategoryRerankLlmService.MAX_CANDIDATES);
        const boundedExamples = examples.slice(0, CategoryRerankLlmService.MAX_EXAMPLES);
        const candidateIds = boundedCandidates.map(candidate => candidate.id);

        const response = await this.chat.generate(
            CATEGORY_RERANK_SYSTEM_PROMPT,
            this.buildUserMessage(merchant, boundedCandidates, boundedExamples),
            this.buildGenerationOptions(candidateIds)
        );

        return this.parseCategoryId(response, candidateIds);
    }

    private buildUserMessage(
        merchant: CategoryRerankMerchantInterface,
        candidates: CategoryRerankCandidateInterface[],
        examples: CategoryRerankExampleInterface[]
    ): string {
        const categoryLines = candidates.map(candidate => `${candidate.id} ${candidate.title} (${candidate.titleEn ?? candidate.title})`);
        const exampleLines = examples.map(example => `"${example.title}" -> ${example.categoryId}`);

        return [
            'CATEGORIES:',
            ...categoryLines,
            'PAST EXAMPLES:',
            ...exampleLines,
            `MERCHANT: "${merchant.title}"`,
            `MCC: ${merchant.mccDescription ?? 'none'}`,
            `SEEN: ${merchant.rowCount} times, typical ${merchant.typicalAmountLabel}`
        ].join('\n');
    }

    private buildGenerationOptions(candidateIds: number[]): GenerateOptionsInterface {
        return {
            maxNewTokens: CategoryRerankLlmService.MAX_NEW_TOKENS,
            responseFormat: {
                jsonSchema: {
                    schema: {
                        type: 'object',
                        additionalProperties: false,
                        required: ['categoryId'],
                        properties: {
                            categoryId: { enum: [...candidateIds, CategoryRerankLlmService.UNRESOLVED_CATEGORY_ID] }
                        }
                    },
                    strict: true
                },
                type: 'json_schema'
            },
            temperature: 0
        };
    }

    private parseCategoryId(response: string, candidateIds: number[]): number | null {
        try {
            const parsed: unknown = JSON.parse(response);
            const result = CategoryRerankLlmService.RESPONSE_SCHEMA.safeParse(parsed);

            if (!result.success || result.data.categoryId === CategoryRerankLlmService.UNRESOLVED_CATEGORY_ID) {
                return null;
            }

            return candidateIds.includes(result.data.categoryId) ? result.data.categoryId : null;
        } catch {
            return null;
        }
    }
}
