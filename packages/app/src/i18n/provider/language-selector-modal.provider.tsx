import { ReactNode } from 'react';

import { useModalResolver } from '../../@generic/hook/use-modal-resolver/use-modal-resolver.hook';
import {
    LanguageSelectorModalContext,
    LanguageSelectorModalParams,
    LanguageSelectorResult
} from '../context/language-selector-modal.context';

interface Props {
    readonly children: ReactNode;
}

export const LanguageSelectorModalProvider = ({ children }: Props) => {
    const { currentParams, open, resolve } = useModalResolver<LanguageSelectorModalParams, LanguageSelectorResult>('/language-selector');

    const value = { openLanguageSelector: open, resolveLanguageSelector: resolve, currentParams };

    return <LanguageSelectorModalContext value={value}>{children}</LanguageSelectorModalContext>;
};
