import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { TAG_GENERATION_SYSTEM_PROMPT, TRANSLATION_SYSTEM_PROMPT, TRANSLATION_TEMPERATURE } from '../constant/translation-prompt.constant';
import { LlmInterface } from '../context/llm.context';

export interface TranslationResultInterface {
    titleEn: string;
    titleTags: string;
}

export class BaseLlmService {
    constructor(protected readonly llm: LlmInterface) {}

    protected async generateTranslationAndTags(title: string): Promise<TranslationResultInterface> {
        const titleEn = await this.llm.generate(TRANSLATION_SYSTEM_PROMPT, title, { temperature: TRANSLATION_TEMPERATURE });
        const trimmedTitleEn = titleEn.trim().toLowerCase();

        const tags = await this.llm.generate(TAG_GENERATION_SYSTEM_PROMPT, trimmedTitleEn, { temperature: TRANSLATION_TEMPERATURE });
        const trimmedTags = tags.trim().toLowerCase();

        return { titleEn: trimmedTitleEn, titleTags: trimmedTags };
    }

    protected parseSuggestionResponse(response: string, entities: Pick<{ id: number }, 'id'>[], maxSuggestions: number): number[] {
        const trimmed = response.trim();

        return trimmed
            .split(',')
            .map(part => parseInt(part.trim(), 10))
            .filter(id => !isNaN(id) && id !== 0)
            .map(id => (entities.some(entity => entity.id === id) ? id : null))
            .filter(isDefined)
            .slice(0, maxSuggestions);
    }

    /* eslint-disable lingui/no-unlocalized-strings -- LLM prompt labels */
    protected buildTransactionContext(title: string, mccDescription: string | null, comment: string, categoryName?: string | null): string {
        const parts: string[] = [];
        const hasTitle = isNotEmptyString(title);

        if (hasTitle) {
            parts.push(`Transaction: ${title}`);
        }

        if (isNotEmptyString(categoryName)) {
            parts.push(`Category: ${categoryName}`);
        }

        if (isNotEmptyString(mccDescription)) {
            parts.push(`Type: ${mccDescription}`);
        }

        if (isNotEmptyString(comment)) {
            const commentLabel = hasTitle ? 'Note' : 'Transaction';
            parts.push(`${commentLabel}: ${comment}`);
        }

        return parts.join(' | ');
    }
    /* eslint-enable lingui/no-unlocalized-strings */
}
