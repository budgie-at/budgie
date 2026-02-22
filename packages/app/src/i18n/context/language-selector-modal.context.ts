import { LanguageEnum } from '@budgie/contracts';

import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';

export interface LanguageSelectorModalParams {
    readonly selectedLanguage: LanguageEnum;
}

export type LanguageSelectorResult = LanguageEnum | null;

export const [LanguageSelectorModalContext, useLanguageSelectorModal] = createModalContext<
    LanguageSelectorModalParams,
    LanguageSelectorResult
>(null);
