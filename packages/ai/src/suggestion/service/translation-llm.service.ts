import { Log } from '@budgie/logger';

import { getErrorMessage, isNotEmptyString } from '@rnw-community/shared';

import { ChatInvokerInterface } from '../../chat/interface/chat-invoker.interface';
import { containsNonLatin } from '../../embedding/util/contains-non-latin.util';
import { TAG_GENERATION_SYSTEM_PROMPT, TRANSLATION_SYSTEM_PROMPT, TRANSLATION_TEMPERATURE } from '../constant/translation-prompt.constant';
import { TranslationResultInterface } from '../interface/translation-result.interface';

export class TranslationLlmService {
    private static readonly LOG_PREVIEW_LENGTH = 16;

    constructor(private readonly chat: ChatInvokerInterface) {}

    @Log(
        title => `enter titlePreview="${title.slice(0, TranslationLlmService.LOG_PREVIEW_LENGTH)}" titleLen=${title.length}`,
        result => `done titleEnLen=${result.titleEn.length} tagsLen=${result.titleTags.length}`,
        (error, title) =>
            `throw titlePreview="${title.slice(0, TranslationLlmService.LOG_PREVIEW_LENGTH)}" titleLen=${title.length} error=${getErrorMessage(error)}`
    )
    async translate(title: string): Promise<TranslationResultInterface> {
        const trimmedTitleEn = await this.translateToEnglish(title);
        const trimmedTags = await this.generateTags(trimmedTitleEn);

        return { titleEn: trimmedTitleEn, titleTags: trimmedTags };
    }

    @Log(
        titleEn => `enter titleEnPreview="${titleEn.slice(0, TranslationLlmService.LOG_PREVIEW_LENGTH)}" titleEnLen=${titleEn.length}`,
        result => `done tagsLen=${result.length}`,
        (error, titleEn) =>
            `throw titleEnPreview="${titleEn.slice(0, TranslationLlmService.LOG_PREVIEW_LENGTH)}" titleEnLen=${titleEn.length} error=${getErrorMessage(error)}`
    )
    private async generateTags(titleEn: string): Promise<string> {
        const tags = await this.chat.generate(TAG_GENERATION_SYSTEM_PROMPT, titleEn, { temperature: TRANSLATION_TEMPERATURE });

        return this.normalizeTags(tags);
    }

    @Log(
        title => `enter titlePreview="${title.slice(0, TranslationLlmService.LOG_PREVIEW_LENGTH)}" titleLen=${title.length}`,
        result => `done resultLen=${result.length}`,
        (error, title) =>
            `throw titlePreview="${title.slice(0, TranslationLlmService.LOG_PREVIEW_LENGTH)}" titleLen=${title.length} error=${getErrorMessage(error)}`
    )
    private async translateToEnglish(title: string): Promise<string> {
        if (!containsNonLatin(title)) {
            return title.trim().toLowerCase();
        }

        const titleEn = await this.chat.generate(TRANSLATION_SYSTEM_PROMPT, title, { temperature: TRANSLATION_TEMPERATURE });

        return titleEn.trim().toLowerCase();
    }

    private normalizeTags(tags: string): string {
        const normalizedTags = tags
            .split(',')
            .map(tag => tag.trim().toLowerCase())
            .filter(isNotEmptyString);

        const uniqueTags = [...new Set(normalizedTags)];

        return uniqueTags.join(', ');
    }
}
