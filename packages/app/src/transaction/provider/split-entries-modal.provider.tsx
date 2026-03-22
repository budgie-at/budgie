import { createModalProvider } from '../../@generic/utils/create-modal-provider/create-modal-provider.util';
import { SplitEntriesModalContext } from '../context/split-entries-modal.context';

import type { SplitEntriesModalParams, SplitEntriesModalResult } from '../context/split-entries-modal.context';

export const SplitEntriesModalProvider = createModalProvider<SplitEntriesModalParams, SplitEntriesModalResult>(
    SplitEntriesModalContext,
    '/split-entries'
);
