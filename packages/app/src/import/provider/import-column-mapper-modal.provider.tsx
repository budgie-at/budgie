import { createModalProvider } from '../../@generic/utils/create-modal-provider/create-modal-provider.util';
import { ImportColumnMapperModalContext } from '../context/import-column-mapper-modal.context';

import type { ImportColumnMapperModalParams, ImportColumnMapperResult } from '../context/import-column-mapper-modal.context';

export const ImportColumnMapperModalProvider = createModalProvider<ImportColumnMapperModalParams, ImportColumnMapperResult>(
    ImportColumnMapperModalContext,
    '/import-column-mapper'
);
