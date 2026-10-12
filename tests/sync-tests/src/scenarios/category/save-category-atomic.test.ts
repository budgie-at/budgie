import { createCategory } from '@app/category/utils/create-category.util';
import { updateCategory } from '@app/category/utils/update-category.util';
import { CategoryRepository, LanguageEnum, UserIconNameEnum } from '@budgie/contracts';
import { describe, expect, it, vi } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { TestLayer } from '../../harness';

describe('category/save-category-atomic', () => {
    it.effect('persists the title and translation together on create and update', () =>
        Effect.gen(function* () {
            const categoryRepository = yield* CategoryRepository;
            const created = yield* createCategory(
                { title: 'Pets', icon: UserIconNameEnum.ShoppingBasket },
                { titleEn: 'pets', titleTags: 'animals, pets' }
            );

            const updated = yield* updateCategory(
                created.id,
                { title: 'Pet care', icon: UserIconNameEnum.ShoppingBasket },
                { titleEn: 'pet care', titleTags: 'animals, vet' },
                LanguageEnum.EN
            );
            const [persisted] = yield* categoryRepository.findById(created.id, LanguageEnum.EN);

            expect(updated.title).toBe('Pet care');
            expect(persisted).toMatchObject({ title: 'Pet care', titleEn: 'pet care', titleTags: 'animals, vet' });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('rolls back the title when the translation write fails during update', () =>
        Effect.gen(function* () {
            const categoryRepository = yield* CategoryRepository;
            const created = yield* createCategory(
                { title: 'Pets', icon: UserIconNameEnum.ShoppingBasket },
                { titleEn: 'pets', titleTags: 'animals, pets' }
            );
            vi.spyOn(categoryRepository, 'updateTranslation').mockReturnValue(Effect.die(new Error('translation write failed')));

            yield* Effect.exit(
                updateCategory(
                    created.id,
                    { title: 'Pet care', icon: UserIconNameEnum.ShoppingBasket },
                    { titleEn: 'pet care', titleTags: 'vet' },
                    LanguageEnum.EN
                )
            );
            const [persisted] = yield* categoryRepository.findById(created.id, LanguageEnum.EN);

            expect(persisted.title).toBe('Pets');
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not create the category when the translation write fails during create', () =>
        Effect.gen(function* () {
            const categoryRepository = yield* CategoryRepository;
            vi.spyOn(categoryRepository, 'updateTranslation').mockReturnValue(Effect.die(new Error('translation write failed')));

            yield* Effect.exit(
                createCategory({ title: 'Ghost', icon: UserIconNameEnum.ShoppingBasket }, { titleEn: 'ghost', titleTags: 'spirits' })
            );

            expect(yield* categoryRepository.findBySearchQuery('Ghost', true, LanguageEnum.EN)).toHaveLength(0);
        }).pipe(Effect.provide(TestLayer))
    );
});
