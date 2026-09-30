import { TagRepository } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { UseRegenerateTranslationReturn, useRegenerateTranslation } from '../../@generic/hook/use-regenerate-translation.hook';

const updateTranslation = (id: number, titleEn: string, titleTags: string) =>
    Effect.flatMap(TagRepository, tagRepository => tagRepository.updateTranslation(id, titleEn, titleTags));

export const useRegenerateTagTranslation = (): UseRegenerateTranslationReturn => useRegenerateTranslation(updateTranslation);
