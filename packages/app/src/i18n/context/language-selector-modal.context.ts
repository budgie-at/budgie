import { LanguageEnum } from '@budgie/contracts';
import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

export interface LanguageSelectorModalParams {
    readonly selectedLanguage: LanguageEnum;
}

export type LanguageSelectorResult = LanguageEnum | null;

interface LanguageSelectorModalContextInterface {
    openLanguageSelector: (params?: LanguageSelectorModalParams) => Promise<LanguageSelectorResult>;
    resolveLanguageSelector: (result: LanguageSelectorResult) => void;
    currentParams: LanguageSelectorModalParams | null;
}

export const LanguageSelectorModalContext = createContext<LanguageSelectorModalContextInterface>({
    openLanguageSelector: () => Promise.resolve(null),
    resolveLanguageSelector: emptyFn,
    currentParams: null
});

export const useLanguageSelectorModal = () => use(LanguageSelectorModalContext);
