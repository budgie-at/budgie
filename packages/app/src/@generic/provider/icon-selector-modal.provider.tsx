import { IconSelectorModalContext } from '../context/icon-selector-modal.context';
import { createModalProvider } from '../utils/create-modal-provider/create-modal-provider.util';

import type { IconSelectorModalParams, IconSelectorResult } from '../context/icon-selector-modal.context';

export const IconSelectorModalProvider = createModalProvider<IconSelectorModalParams, IconSelectorResult>(
    IconSelectorModalContext,
    '/icon-selector'
);
