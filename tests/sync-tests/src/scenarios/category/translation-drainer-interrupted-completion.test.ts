import { categoryRepository } from '@app/@generic/drizzle/db/db';
import { chatService } from '@app/ai/service/chat.service';
import { translationDrainerService } from '@app/ai/service/translation-drainer.service';
import { LanguageEnum, UserIconNameEnum } from '@budgie/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { CategoryOrTagRowInterface } from '@app/ai/interface/category-or-tag-row.interface';

const spyOnGenerate = () => vi.spyOn(chatService, 'generate');

const createCategoryRow = async (): Promise<CategoryOrTagRowInterface> => {
    const [category] = await categoryRepository.bulkCreate([{ title: 'Продукти', icon: UserIconNameEnum.ShoppingBasket }]);

    return { kind: 'category', id: category.id, title: category.title };
};

describe('category/translation-drainer-interrupted-completion', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('leaves titleEn NULL and keeps the row pending when the completion is interrupted mid-generation', async () => {
        const row = await createCategoryRow();
        spyOnGenerate().mockRejectedValue(new Error('completionInterrupted'));

        await expect(translationDrainerService['processRow'](row)).rejects.toThrow('completionInterrupted');

        const [persisted] = await categoryRepository.findById(row.id, LanguageEnum.EN);
        expect(persisted.titleEn).toBeNull();
        expect(await categoryRepository.findUntranslated(1000)).toContainEqual({ id: row.id, title: row.title });
    });

    it('persists the translation and clears the pending row once generation completes normally', async () => {
        const row = await createCategoryRow();
        spyOnGenerate().mockResolvedValueOnce('groceries').mockResolvedValueOnce('food, groceries, shopping');

        await translationDrainerService['processRow'](row);

        const [persisted] = await categoryRepository.findById(row.id, LanguageEnum.EN);
        expect(persisted.titleEn).toBe('groceries');
        expect(await categoryRepository.findUntranslated(1000)).not.toContainEqual(expect.objectContaining({ id: row.id }));
    });
});
