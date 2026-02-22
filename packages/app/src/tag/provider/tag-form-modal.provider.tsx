import { createModalProvider } from '../../@generic/utils/create-modal-provider/create-modal-provider.util';
import { TagFormModalContext } from '../context/tag-form-modal.context';

import type { TagFormModalParams, TagFormModalResult } from '../context/tag-form-modal.context';

export const TagFormModalProvider = createModalProvider<TagFormModalParams, TagFormModalResult>(TagFormModalContext, '/tag-form');
