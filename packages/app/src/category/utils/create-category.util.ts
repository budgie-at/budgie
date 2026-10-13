import { CategoryRepository, Db } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { saveCategoryTranslation } from './save-category-translation.util';

import type { CategoryCreateEntityInterface, CategoryEntityInterface } from '@budgie/contracts';

export const createCategory = Effect.fn('createCategory')(
    function* (input: CategoryCreateEntityInterface, translation: Pick<CategoryEntityInterface, 'titleEn' | 'titleTags'>) {
        const categoryRepository = yield* CategoryRepository;
        const category = yield* categoryRepository.create(input);
        yield* saveCategoryTranslation(category.id, translation);

        return category;
    },
    effect => Db.transaction(effect)
);
