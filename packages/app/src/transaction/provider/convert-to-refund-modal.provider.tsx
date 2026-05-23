import { createModalProvider } from '../../@generic/utils/create-modal-provider/create-modal-provider.util';
import { ConvertToRefundModalContext } from '../context/convert-to-refund-modal.context';

import type { ConvertToRefundModalParamsInterface } from '../interface/convert-to-refund-modal-params.interface';
import type { ConvertToRefundModalResultType } from '../interface/convert-to-refund-modal-result.type';

export const ConvertToRefundModalProvider = createModalProvider<ConvertToRefundModalParamsInterface, ConvertToRefundModalResultType>(
    ConvertToRefundModalContext,
    '/convert-to-refund'
);
