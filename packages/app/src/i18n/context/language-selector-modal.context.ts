import { LanguageEnum } from '@budgie/contracts';

import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';

import type { AnchoredMorphOriginInterface } from '../../@generic/interface/anchored-morph-origin.interface';

export interface LanguageSelectorModalParams {
    readonly selectedLanguage: LanguageEnum;
    readonly origin?: AnchoredMorphOriginInterface;
}

export type LanguageSelectorResult = LanguageEnum | null;

export const [LanguageSelectorModalContext, useLanguageSelectorModal, useLanguageSelectorModalParams] = createModalContext<
    LanguageSelectorModalParams,
    LanguageSelectorResult
>(null);
