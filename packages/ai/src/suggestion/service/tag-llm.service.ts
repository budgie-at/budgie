import { TagEntityInterface } from '@budgie/contracts';

import { isDefined, isEmptyArray } from '@rnw-community/shared';

import { buildTransactionContext } from '../../embedding/util/build-transaction-context.util';
import { TranslationResultInterface } from '../interface/translation-result.interface';

import { BaseLlmService } from './base-llm.service';

export interface TagSuggestionParamsInterface {
    transactionTitle: string;
    categoryName: string | null;
    mccDescription: string | null;
    comment: string;
    tags: TagEntityInterface[];
}

const MAX_SUGGESTIONS = 3;

export class TagLlmService extends BaseLlmService {
    async translate(title: string): Promise<TranslationResultInterface> {
        return this.generateTranslationAndTags(title);
    }

    async suggestTags(params: TagSuggestionParamsInterface): Promise<TagEntityInterface[]> {
        const { transactionTitle, categoryName, mccDescription, comment, tags } = params;

        if (isEmptyArray(tags)) {
            return [];
        }

        const systemPrompt = this.buildSuggestionPrompt(tags);
        const context = buildTransactionContext(transactionTitle, mccDescription, comment, { categoryName });
        const response = await this.llm.generate(systemPrompt, context);
        const tagIds = this.parseSuggestionResponse(response, tags, MAX_SUGGESTIONS);

        return tagIds.map(id => tags.find(tag => tag.id === id)).filter(isDefined);
    }

    private buildSuggestionPrompt(tags: TagEntityInterface[]): string {
        const tagList = tags.map(tag => `${tag.id}=${tag.titleEn ?? tag.title}`).join(', ');
        const exampleId = tags[0]?.id ?? 1;
        const exampleId2 = tags[1]?.id ?? 2;
        const exampleId3 = tags[2]?.id ?? 3;

        return `Pick exactly 3 tag IDs that best match the transaction. Return ONLY numbers.

TAGS: ${tagList}

Always return 3 comma-separated IDs from TAGS above, best match first.
Example: ${exampleId},${exampleId2},${exampleId3}
If nothing matches at all: 0`;
    }
}
