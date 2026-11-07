import { CategoryRepository, Db } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { saveCategoryTranslation } from './save-category-translation.util';

import type { CategoryCreateEntityInterface, CategoryEntityInterface, DbError } from '@budgie/contracts';

export const createCategory: (
    input: CategoryCreateEntityInterface & Partial<Pick<CategoryEntityInterface, 'syncZone'>>,
    translation: Pick<CategoryEntityInterface, 'titleEn' | 'titleTags'>
) => Effect.Effect<CategoryEntityInterface, DbError, CategoryRepository | Db> = Effect.fn('createCategory')(
    function* (
        input: CategoryCreateEntityInterface & Partial<Pick<CategoryEntityInterface, 'syncZone'>>,
        translation: Pick<CategoryEntityInterface, 'titleEn' | 'titleTags'>
    ) {
        const categoryRepository = yield* CategoryRepository;
        const category = yield* categoryRepository.create(input);
        yield* saveCategoryTranslation(category.id, translation);

        return category;
    },
    effect => Db.transaction(effect)
);
