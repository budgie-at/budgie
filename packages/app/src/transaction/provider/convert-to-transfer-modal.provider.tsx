import { createModalProvider } from '../../@generic/utils/create-modal-provider/create-modal-provider.util';
import { ConvertToTransferModalContext } from '../context/convert-to-transfer-modal.context';

import type { ConvertToTransferModalParams } from '../context/convert-to-transfer-modal.context';

export const ConvertToTransferModalProvider = createModalProvider<ConvertToTransferModalParams, boolean>(
    ConvertToTransferModalContext,
    '/convert-to-transfer'
);
