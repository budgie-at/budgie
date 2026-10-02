import { CategoryRepository } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { UseRegenerateTranslationReturn, useRegenerateTranslation } from '../../@generic/hook/use-regenerate-translation.hook';

const updateTranslation = (id: number, titleEn: string, titleTags: string) =>
    Effect.flatMap(CategoryRepository, categoryRepository => categoryRepository.updateTranslation(id, titleEn, titleTags));

export const useRegenerateCategoryTranslation = (): UseRegenerateTranslationReturn => useRegenerateTranslation(updateTranslation);
