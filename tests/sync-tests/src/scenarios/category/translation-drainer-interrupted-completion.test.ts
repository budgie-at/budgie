import { categoryRepository } from '@app/@generic/drizzle/db/db';
import { chatService } from '@app/ai/service/chat.service';
import { translationDrainerService } from '@app/ai/service/translation-drainer.service';
import { LanguageEnum, UserIconNameEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getDefined } from '@rnw-community/shared';

import { run } from '../../harness';

const spyOnGenerate = () => vi.spyOn(chatService, 'generate');

const createPendingCategory = async () => {
    await run(
        Effect.gen(function* () {
            for (const seeded of yield* categoryRepository.findUntranslated(1000)) {
                yield* categoryRepository.updateTranslation(seeded.id, seeded.title.toLowerCase(), '');
            }
        })
    );
    const [category] = await run(categoryRepository.bulkCreate([{ title: 'Продукти', icon: UserIconNameEnum.ShoppingBasket }]));

    return category;
};

const takePendingTranslation = async () => {
    const [translation] = await run(translationDrainerService['config'].fetchPending(1));

    return getDefined(translation, () => {
        throw new Error('no pending translation');
    });
};

describe('category/translation-drainer-interrupted-completion', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('leaves titleEn NULL and keeps the row pending when the completion is interrupted mid-generation', async () => {
        const category = await createPendingCategory();
        spyOnGenerate().mockRejectedValue(new Error('completionInterrupted'));
        const translation = await takePendingTranslation();

        const error = await run(Effect.flip(translation));

        expect(error.cause).toEqual(new Error('completionInterrupted'));

        const [persisted] = await categoryRepository.findById(category.id, LanguageEnum.EN);
        expect(persisted.titleEn).toBeNull();
        expect(await run(categoryRepository.findUntranslated(1000))).toContainEqual({ id: category.id, title: category.title });
    });

    it('persists the translation and clears the pending row once generation completes normally', async () => {
        const category = await createPendingCategory();
        spyOnGenerate().mockResolvedValueOnce('groceries').mockResolvedValueOnce('food, groceries, shopping');
        const translation = await takePendingTranslation();

        await run(translation);

        const [persisted] = await categoryRepository.findById(category.id, LanguageEnum.EN);
        expect(persisted.titleEn).toBe('groceries');
        expect(await run(categoryRepository.findUntranslated(1000))).not.toContainEqual(expect.objectContaining({ id: category.id }));
    });
});
