import { Log } from '@budgie/contracts';

import { getErrorMessage } from '@rnw-community/shared';

import { ChatInvokerInterface } from '../../chat/interface/chat-invoker.interface';
import { containsNonLatin } from '../../embedding/util/contains-non-latin.util';
import { TAG_GENERATION_SYSTEM_PROMPT, TRANSLATION_SYSTEM_PROMPT, TRANSLATION_TEMPERATURE } from '../constant/translation-prompt.constant';
import { TranslationResultInterface } from '../interface/translation-result.interface';

export class TranslationLlmService {
    constructor(private readonly chat: ChatInvokerInterface) {}

    @Log(
        title => `enter titleLen=${title.length}`,
        result => `done titleEnLen=${result.titleEn.length} tagsLen=${result.titleTags.length}`,
        (error, title) => `throw titleLen=${title.length} error=${getErrorMessage(error)}`
    )
    async translate(title: string): Promise<TranslationResultInterface> {
        const trimmedTitleEn = await this.translateToEnglish(title);
        const trimmedTags = await this.generateTags(trimmedTitleEn);

        return { titleEn: trimmedTitleEn, titleTags: trimmedTags };
    }

    @Log(
        titleEn => `enter titleEnLen=${titleEn.length}`,
        result => `done tagsLen=${result.length}`,
        (error, titleEn) => `throw titleEnLen=${titleEn.length} error=${getErrorMessage(error)}`
    )
    private async generateTags(titleEn: string): Promise<string> {
        const tags = await this.chat.generate(TAG_GENERATION_SYSTEM_PROMPT, titleEn, { temperature: TRANSLATION_TEMPERATURE });

        return tags.trim().toLowerCase();
    }

    @Log(
        title => `enter titleLen=${title.length}`,
        result => `done resultLen=${result.length}`,
        (error, title) => `throw titleLen=${title.length} error=${getErrorMessage(error)}`
    )
    private async translateToEnglish(title: string): Promise<string> {
        if (!containsNonLatin(title)) {
            return title.trim().toLowerCase();
        }

        const titleEn = await this.chat.generate(TRANSLATION_SYSTEM_PROMPT, title, { temperature: TRANSLATION_TEMPERATURE });

        return titleEn.trim().toLowerCase();
    }
}
