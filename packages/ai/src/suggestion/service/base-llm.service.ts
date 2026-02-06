import { isDefined } from '@rnw-community/shared';

import { LlmInterface } from '../../@generic/interface/llm.interface';
import { TAG_GENERATION_SYSTEM_PROMPT, TRANSLATION_SYSTEM_PROMPT, TRANSLATION_TEMPERATURE } from '../constant/translation-prompt.constant';
import { TranslationResultInterface } from '../interface/translation-result.interface';

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
}
