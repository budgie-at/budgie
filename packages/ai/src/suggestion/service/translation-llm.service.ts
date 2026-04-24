import { Log, LoggerNamespaceEnum, getLogger } from '@budgie/contracts';

import { getErrorMessage } from '@rnw-community/shared';

import { ChatInvokerInterface } from '../../chat/interface/chat-invoker.interface';
import { containsNonLatin } from '../../embedding/util/contains-non-latin.util';
import { TAG_GENERATION_SYSTEM_PROMPT, TRANSLATION_SYSTEM_PROMPT, TRANSLATION_TEMPERATURE } from '../constant/translation-prompt.constant';
import { TranslationResultInterface } from '../interface/translation-result.interface';

const logger = getLogger(LoggerNamespaceEnum.AI);

export class TranslationLlmService {
    constructor(private readonly chat: ChatInvokerInterface) {}

    @Log(LoggerNamespaceEnum.AI, 'translation:translate:start')
    async translate(title: string): Promise<TranslationResultInterface> {
        const started = Date.now();
        try {
            const trimmedTitleEn = await this.translateToEnglish(title);

            const tags = await this.chat.generate(TAG_GENERATION_SYSTEM_PROMPT, trimmedTitleEn, { temperature: TRANSLATION_TEMPERATURE });
            const trimmedTags = tags.trim().toLowerCase();

            logger.log('translation:translate:complete', {
                durationMs: Date.now() - started,
                titleEnLen: trimmedTitleEn.length,
                tagsLen: trimmedTags.length
            });

            return { titleEn: trimmedTitleEn, titleTags: trimmedTags };
        } catch (error: unknown) {
            logger.log('translation:translate:throw', { errorMessage: getErrorMessage(error) });
            throw error;
        }
    }

    private async translateToEnglish(title: string): Promise<string> {
        if (!containsNonLatin(title)) {
            return title.trim().toLowerCase();
        }

        const titleEn = await this.chat.generate(TRANSLATION_SYSTEM_PROMPT, title, { temperature: TRANSLATION_TEMPERATURE });

        return titleEn.trim().toLowerCase();
    }
}
