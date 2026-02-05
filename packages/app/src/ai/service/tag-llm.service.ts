import { TagEntityInterface } from '@budgie/contracts';

import { isDefined, isEmptyArray } from '@rnw-community/shared';

import { tagRepository } from '../../@generic/drizzle/db/db';

import { BaseLlmService, TranslationResultInterface } from './base-llm.service';

interface TagSuggestionParams {
    transactionTitle: string;
    categoryName: string | null;
    mccDescription: string | null;
    comment: string;
    tags: TagEntityInterface[];
}

interface TagLlmErrorHandler {
    (tag: TagEntityInterface, error: unknown): void;
}

const MAX_SUGGESTIONS = 3;

export class TagLlmService extends BaseLlmService {
    async regenerateOne(tagId: number, title: string): Promise<TranslationResultInterface> {
        const result = await this.generateTranslationAndTags(title);
        await this.saveTranslation(tagId, result);

        return result;
    }

    async regenerateAll(onError?: TagLlmErrorHandler): Promise<void> {
        const tags = await tagRepository.findAll();

        for (const tag of tags) {
            try {
                const result = await this.generateTranslationAndTags(tag.title);
                await this.saveTranslation(tag.id, result);
            } catch (error: unknown) {
                onError?.(tag, error);
            }
        }
    }

    async suggestTags(params: TagSuggestionParams): Promise<TagEntityInterface[]> {
        const { transactionTitle, categoryName, mccDescription, comment, tags } = params;

        if (isEmptyArray(tags)) {
            return [];
        }

        const systemPrompt = this.buildSuggestionPrompt(tags);
        const context = this.buildTransactionContext(transactionTitle, mccDescription, comment, categoryName);
        const response = await this.llm.generate(systemPrompt, context);
        const tagIds = this.parseSuggestionResponse(response, tags, MAX_SUGGESTIONS);

        return tagIds.map(id => tags.find(tag => tag.id === id)).filter(isDefined);
    }

    private async saveTranslation(tagId: number, result: TranslationResultInterface): Promise<void> {
        await tagRepository.updateTranslation(tagId, result.titleEn, result.titleTags);
    }

    private buildSuggestionPrompt(tags: TagEntityInterface[]): string {
        const tagList = tags.map(tag => `${tag.id}=${tag.titleEn ?? tag.title}`).join(', ');
        const exampleId = tags[0]?.id ?? 1;
        const exampleId2 = tags[1]?.id ?? 2;
        const exampleId3 = tags[2]?.id ?? 3;

        /* eslint-disable lingui/no-unlocalized-strings */
        return `Pick exactly 3 tag IDs that best match the transaction. Return ONLY numbers.

TAGS: ${tagList}

Always return 3 comma-separated IDs from TAGS above, best match first.
Example: ${exampleId},${exampleId2},${exampleId3}
If nothing matches at all: 0`;
        /* eslint-enable lingui/no-unlocalized-strings */
    }
}
