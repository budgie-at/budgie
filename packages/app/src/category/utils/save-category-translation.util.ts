import { CategoryRepository } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { isNotEmptyString } from '@rnw-community/shared';

import type { CategoryEntityInterface } from '@budgie/contracts';

export const saveCategoryTranslation = Effect.fnUntraced(function* (
    categoryId: number,
    { titleEn, titleTags }: Pick<CategoryEntityInterface, 'titleEn' | 'titleTags'>
) {
    const categoryRepository = yield* CategoryRepository;

    if (isNotEmptyString(titleEn) && isNotEmptyString(titleTags)) {
        yield* categoryRepository.updateTranslation(categoryId, titleEn, titleTags);
    } else {
        yield* categoryRepository.clearTranslation(categoryId);
    }
});
