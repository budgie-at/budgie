import { CategoryRepository, Db } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { saveCategoryTranslation } from './save-category-translation.util';

import type { CategoryCreateEntityInterface, CategoryEntityInterface, LanguageEnum } from '@budgie/contracts';

export const updateCategory = Effect.fn('updateCategory')(
    function* (
        categoryId: number,
        input: CategoryCreateEntityInterface,
        translation: Pick<CategoryEntityInterface, 'titleEn' | 'titleTags'>,
        language: LanguageEnum
    ) {
        const categoryRepository = yield* CategoryRepository;
        yield* categoryRepository.updateById(categoryId, input);
        yield* saveCategoryTranslation(categoryId, translation);
        const [savedCategory] = yield* categoryRepository.findById(categoryId, language);

        return savedCategory;
    },
    effect => Db.transaction(effect)
);
