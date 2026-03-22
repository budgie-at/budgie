import { tagRepository } from '../../@generic/drizzle/db/db';
import { UseRegenerateTranslationReturn, useRegenerateTranslation } from '../../@generic/hook/use-regenerate-translation.hook';

const updateTranslation = (id: number, titleEn: string, titleTags: string): Promise<void> =>
    tagRepository.updateTranslation(id, titleEn, titleTags);

export const useRegenerateTagTranslation = (): UseRegenerateTranslationReturn => useRegenerateTranslation(updateTranslation);
