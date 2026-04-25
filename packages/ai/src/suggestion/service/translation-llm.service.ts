import { Log } from '@budgie/contracts';

import { ChatInvokerInterface } from '../../chat/interface/chat-invoker.interface';
import { containsNonLatin } from '../../embedding/util/contains-non-latin.util';
import { TAG_GENERATION_SYSTEM_PROMPT, TRANSLATION_SYSTEM_PROMPT, TRANSLATION_TEMPERATURE } from '../constant/translation-prompt.constant';
import { TranslationResultInterface } from '../interface/translation-result.interface';

export class TranslationLlmService {
    constructor(private readonly chat: ChatInvokerInterface) {}

    @Log(
        (title: string) => `translate:enter titleLen=${title.length}`,
        (result, title: string) =>
            `translate:done titleLen=${title.length} titleEnLen=${result.titleEn.length} tagsLen=${result.titleTags.length}`,
        (error, title: string) => `translate:throw titleLen=${title.length} error=${String(error)}`
    )
    async translate(title: string): Promise<TranslationResultInterface> {
        const trimmedTitleEn = await this.translateToEnglish(title);
        const trimmedTags = await this.generateTags(trimmedTitleEn);

        return { titleEn: trimmedTitleEn, titleTags: trimmedTags };
    }

    @Log(
        (titleEn: string) => `generateTags:enter titleEnLen=${titleEn.length}`,
        (result, titleEn: string) => `generateTags:done titleEnLen=${titleEn.length} tagsLen=${result.length}`,
        (error, titleEn: string) => `generateTags:throw titleEnLen=${titleEn.length} error=${String(error)}`
    )
    private async generateTags(titleEn: string): Promise<string> {
        const tags = await this.chat.generate(TAG_GENERATION_SYSTEM_PROMPT, titleEn, { temperature: TRANSLATION_TEMPERATURE });

        return tags.trim().toLowerCase();
    }

    @Log(
        (title: string) => `translateToEnglish:enter titleLen=${title.length}`,
        (result, title: string) => `translateToEnglish:done titleLen=${title.length} resultLen=${result.length}`,
        (error, title: string) => `translateToEnglish:throw titleLen=${title.length} error=${String(error)}`
    )
    private async translateToEnglish(title: string): Promise<string> {
        if (!containsNonLatin(title)) {
            return title.trim().toLowerCase();
        }

        const titleEn = await this.chat.generate(TRANSLATION_SYSTEM_PROMPT, title, { temperature: TRANSLATION_TEMPERATURE });

        return titleEn.trim().toLowerCase();
    }
}
