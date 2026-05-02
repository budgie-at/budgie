import { createModalProvider } from '../../@generic/utils/create-modal-provider/create-modal-provider.util';
import { ResyncWindowPickerModalContext } from '../context/resync-window-picker-modal.context';

import type { ResyncWindowPickerModalParams } from '../context/resync-window-picker-modal.context';

export const ResyncWindowPickerModalProvider = createModalProvider<ResyncWindowPickerModalParams, null>(
    ResyncWindowPickerModalContext,
    '/resync-window-picker'
);
