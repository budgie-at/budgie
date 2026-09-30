import { ChatService } from '@app/ai/service/chat.service';
import { TranslationDrainerService } from '@app/ai/service/translation-drainer.service';
import { CategoryRepository, LanguageEnum, UserIconNameEnum } from '@budgie/contracts';
import { describe, expect, it, vi } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { getDefined } from '@rnw-community/shared';

import { AiInvokeError } from '../../../../../packages/ai/src/@generic/error/ai-invoke.error';
import { TestLayer } from '../../harness';

const createPendingCategory = Effect.fnUntraced(function* () {
    const categoryRepository = yield* CategoryRepository;

    for (const seeded of yield* categoryRepository.findUntranslated(1000)) {
        yield* categoryRepository.updateTranslation(seeded.id, seeded.title.toLowerCase(), '');
    }
    const [category] = yield* categoryRepository.bulkCreate([{ title: 'Продукти', icon: UserIconNameEnum.ShoppingBasket }]);

    return category;
});

const takePendingTranslation = Effect.fnUntraced(function* () {
    const translationDrainerService = yield* TranslationDrainerService;
    const [translation] = yield* translationDrainerService['config'].fetchPending(1);

    return getDefined(translation, () => {
        throw new Error('no pending translation');
    });
});

describe('category/translation-drainer-interrupted-completion', () => {
    it.effect('leaves titleEn NULL and keeps the row pending when the completion is interrupted mid-generation', () =>
        Effect.gen(function* () {
            const categoryRepository = yield* CategoryRepository;
            const chatService = yield* ChatService;
            const category = yield* createPendingCategory();
            vi.spyOn(chatService, 'generate').mockReturnValue(
                Effect.fail(new AiInvokeError({ cause: new Error('completionInterrupted') }))
            );

            const translation = yield* takePendingTranslation();

            const error = yield* Effect.flip(translation);

            expect(error.cause).toEqual(new Error('completionInterrupted'));

            const [persisted] = yield* categoryRepository.findById(category.id, LanguageEnum.EN);
            expect(persisted.titleEn).toBeNull();
            expect(yield* categoryRepository.findUntranslated(1000)).toContainEqual({ id: category.id, title: category.title });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('persists the translation and clears the pending row once generation completes normally', () =>
        Effect.gen(function* () {
            const categoryRepository = yield* CategoryRepository;
            const chatService = yield* ChatService;
            const category = yield* createPendingCategory();
            vi.spyOn(chatService, 'generate')
                .mockReturnValueOnce(Effect.succeed('groceries'))
                .mockReturnValueOnce(Effect.succeed('food, groceries, shopping'));

            const translation = yield* takePendingTranslation();

            yield* translation;

            const [persisted] = yield* categoryRepository.findById(category.id, LanguageEnum.EN);
            expect(persisted.titleEn).toBe('groceries');
            expect(yield* categoryRepository.findUntranslated(1000)).not.toContainEqual(expect.objectContaining({ id: category.id }));
        }).pipe(Effect.provide(TestLayer))
    );
});
