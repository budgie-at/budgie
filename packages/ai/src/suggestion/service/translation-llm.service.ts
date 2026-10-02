import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isNotEmptyString } from '@rnw-community/shared';

import { ChatInvoker } from '../../chat/service/chat-invoker.service';
import { containsNonLatin } from '../../embedding/util/contains-non-latin.util';
import { TAG_GENERATION_SYSTEM_PROMPT, TRANSLATION_SYSTEM_PROMPT, TRANSLATION_TEMPERATURE } from '../constant/translation-prompt.constant';

export class TranslationLlmService extends Context.Service<TranslationLlmService>()('@budgie/ai/TranslationLlmService', {
    make: Effect.gen(function* () {
        const chat = yield* ChatInvoker;

        const normalizeTags = (tags: string): string => {
            const normalizedTags = tags
                .split(',')
                .map(tag => tag.trim().toLowerCase())
                .filter(isNotEmptyString);

            return [...new Set(normalizedTags)].join(', ');
        };

        const generateTags = Effect.fn('TranslationLlmService.generateTags')(function* (titleEn: string) {
            const tags = yield* chat.generate(TAG_GENERATION_SYSTEM_PROMPT, titleEn, {
                temperature: TRANSLATION_TEMPERATURE,
                throwOnInterrupt: true
            });

            return normalizeTags(tags);
        });

        const translateToEnglish = Effect.fn('TranslationLlmService.translateToEnglish')(function* (title: string) {
            if (!containsNonLatin(title)) {
                return title.trim().toLowerCase();
            }

            const titleEn = yield* chat.generate(TRANSLATION_SYSTEM_PROMPT, title, {
                temperature: TRANSLATION_TEMPERATURE,
                throwOnInterrupt: true
            });

            return titleEn.trim().toLowerCase();
        });

        return {
            translate: Effect.fn('TranslationLlmService.translate')(function* (title: string) {
                const titleEn = yield* translateToEnglish(title);
                const titleTags = yield* generateTags(titleEn);

                return { titleEn, titleTags };
            })
        };
    })
}) {
    static readonly layer = Layer.effect(TranslationLlmService, TranslationLlmService.make);
}
