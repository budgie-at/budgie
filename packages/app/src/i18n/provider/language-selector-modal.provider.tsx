import { createModalProvider } from '../../@generic/utils/create-modal-provider/create-modal-provider.util';
import { LanguageSelectorModalContext } from '../context/language-selector-modal.context';

import type { LanguageSelectorModalParams, LanguageSelectorResult } from '../context/language-selector-modal.context';

export const LanguageSelectorModalProvider = createModalProvider<LanguageSelectorModalParams, LanguageSelectorResult>(
    LanguageSelectorModalContext,
    '/language-selector'
);
