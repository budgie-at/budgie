import { tagRepository } from '../../@generic/drizzle/db/db';
import { UseRegenerateTranslationReturn, useRegenerateTranslation } from '../../@generic/hook/use-regenerate-translation.hook';

const updateTranslation = (id: number, titleEn: string, titleTags: string) => tagRepository.updateTranslation(id, titleEn, titleTags);

export const useRegenerateTagTranslation = (): UseRegenerateTranslationReturn => useRegenerateTranslation(updateTranslation);
