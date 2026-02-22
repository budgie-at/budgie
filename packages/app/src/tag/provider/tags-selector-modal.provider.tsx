import { createModalProvider } from '../../@generic/utils/create-modal-provider/create-modal-provider.util';
import { TagsSelectorModalContext } from '../context/tags-selector-modal.context';

import type { TagsSelectorModalParams, TagsSelectorResult } from '../context/tags-selector-modal.context';

export const TagsSelectorModalProvider = createModalProvider<TagsSelectorModalParams, TagsSelectorResult>(
    TagsSelectorModalContext,
    '/tags-selector'
);
