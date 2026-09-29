import { tagRepository } from '../../@generic/drizzle/db/db';
import { UseRegenerateTranslationReturn, useRegenerateTranslation } from '../../@generic/hook/use-regenerate-translation.hook';
import { appRuntime } from '../../@generic/runtime/app.runtime';

const updateTranslation = (id: number, titleEn: string, titleTags: string): Promise<void> =>
    appRuntime.runPromise(tagRepository.updateTranslation(id, titleEn, titleTags));

export const useRegenerateTagTranslation = (): UseRegenerateTranslationReturn => useRegenerateTranslation(updateTranslation);
