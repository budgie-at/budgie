import * as Effect from 'effect/Effect';

import { isNotEmptyString } from '@rnw-community/shared';

import { generateChatResponse } from '../../@generic/util/generate-chat-response.util';
import { ChatInvokerInterface } from '../../chat/interface/chat-invoker.interface';
import { containsNonLatin } from '../../embedding/util/contains-non-latin.util';
import { TAG_GENERATION_SYSTEM_PROMPT, TRANSLATION_SYSTEM_PROMPT, TRANSLATION_TEMPERATURE } from '../constant/translation-prompt.constant';

export class TranslationLlmService {
    readonly translate = Effect.fn('TranslationLlmService.translate')(function* (this: TranslationLlmService, title: string) {
        const titleEn = yield* this.translateToEnglish(title);
        const titleTags = yield* this.generateTags(titleEn);

        return { titleEn, titleTags };
    });

    private readonly generateTags = Effect.fn('TranslationLlmService.generateTags')(function* (
        this: TranslationLlmService,
        titleEn: string
    ) {
        const tags = yield* generateChatResponse(this.chat, TAG_GENERATION_SYSTEM_PROMPT, titleEn, {
            temperature: TRANSLATION_TEMPERATURE,
            throwOnInterrupt: true
        });

        return this.normalizeTags(tags);
    });

    private readonly translateToEnglish = Effect.fn('TranslationLlmService.translateToEnglish')(function* (
        this: TranslationLlmService,
        title: string
    ) {
        if (!containsNonLatin(title)) {
            return title.trim().toLowerCase();
        }

        const titleEn = yield* generateChatResponse(this.chat, TRANSLATION_SYSTEM_PROMPT, title, {
            temperature: TRANSLATION_TEMPERATURE,
            throwOnInterrupt: true
        });

        return titleEn.trim().toLowerCase();
    });

    constructor(private readonly chat: ChatInvokerInterface) {}

    private normalizeTags(tags: string): string {
        const normalizedTags = tags
            .split(',')
            .map(tag => tag.trim().toLowerCase())
            .filter(isNotEmptyString);

        return [...new Set(normalizedTags)].join(', ');
    }
}
